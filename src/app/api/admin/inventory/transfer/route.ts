import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { logInventoryTransaction, resolveActorFromSession } from '@/lib/inventory/logTransaction'
import { syncProductTotalsFromSizeInventory } from '@/lib/inventory/availability'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/inventory/transfer
 * Body: { productId, size, fromLocationId, toLocationId, quantity, note? }
 *
 * Moves `quantity` units of `size` for `productId` from one active
 * StoreLocation to another, blocked if the source row has any ACTIVE hold
 * referencing it (proxied via heldQuantity > 0, since Hold has no direct
 * locationId — same convention used by the Phase 4-1 remove-location guard).
 */
export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'transfers:create')
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { productId, size, fromLocationId, toLocationId, quantity, note } = body as {
    productId?: string
    size?: string
    fromLocationId?: string
    toLocationId?: string
    quantity?: number
    note?: string
  }

  if (typeof productId !== 'string' || !productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }
  if (typeof size !== 'string' || !size.trim()) {
    return NextResponse.json({ error: 'size is required' }, { status: 400 })
  }
  if (typeof fromLocationId !== 'string' || !fromLocationId) {
    return NextResponse.json({ error: 'fromLocationId is required' }, { status: 400 })
  }
  if (typeof toLocationId !== 'string' || !toLocationId) {
    return NextResponse.json({ error: 'toLocationId is required' }, { status: 400 })
  }
  if (fromLocationId === toLocationId) {
    return NextResponse.json({ error: 'fromLocationId and toLocationId must differ' }, { status: 400 })
  }
  if (!Number.isInteger(quantity) || (quantity as number) <= 0) {
    return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
  }
  const qty = quantity as number
  const noteTrimmed = typeof note === 'string' && note.trim() ? note.trim() : null

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [product, fromLoc, toLoc] = await Promise.all([
        tx.product.findUnique({ where: { id: productId }, select: { id: true } }),
        tx.storeLocation.findUnique({ where: { id: fromLocationId }, select: { id: true, active: true, name: true } }),
        tx.storeLocation.findUnique({ where: { id: toLocationId }, select: { id: true, active: true, name: true } }),
      ])

      if (!product) {
        throw Object.assign(new Error('PRODUCT_NOT_FOUND'), { code: 'PRODUCT_NOT_FOUND' })
      }
      if (!fromLoc || !fromLoc.active) {
        throw Object.assign(new Error('SOURCE_LOCATION_INVALID'), { code: 'SOURCE_LOCATION_INVALID' })
      }
      if (!toLoc || !toLoc.active) {
        throw Object.assign(new Error('DEST_LOCATION_INVALID'), { code: 'DEST_LOCATION_INVALID' })
      }

      const sourceRow = await tx.sizeInventory.findUnique({
        where: { productId_size_locationId: { productId, size, locationId: fromLocationId } },
      })
      if (!sourceRow) {
        throw Object.assign(new Error('SOURCE_ROW_NOT_FOUND'), { code: 'SOURCE_ROW_NOT_FOUND' })
      }
      const available = sourceRow.quantity - sourceRow.heldQuantity - sourceRow.pickedQuantity
      if (available < qty) {
        throw Object.assign(
          new Error(`INSUFFICIENT_STOCK: only ${available} available at ${fromLoc.name}`),
          { code: 'INSUFFICIENT_STOCK', available }
        )
      }

      // Active hold check. Hold has no direct locationId, so heldQuantity > 0
      // on the source row is the proxy signal (same convention used by the
      // remove-location guard in PUT /api/admin/products/[id]/inventory).
      // Count actual ACTIVE holds for this product/size for a precise message.
      if (sourceRow.heldQuantity > 0) {
        const activeHoldCount = await tx.hold.count({
          where: { productId, size, status: 'ACTIVE' },
        })
        if (activeHoldCount > 0) {
          throw Object.assign(
            new Error(`Cannot transfer size held by ${activeHoldCount} active reservation(s)`),
            { code: 'HOLD_CONFLICT', activeHoldCount }
          )
        }
      }

      const sourceBefore = sourceRow ? { quantity: sourceRow.quantity } : null
      const targetBefore = await tx.sizeInventory.findUnique({
        where: { productId_size_locationId: { productId, size, locationId: toLocationId } },
      })

      await tx.sizeInventory.update({
        where: { productId_size_locationId: { productId, size, locationId: fromLocationId } },
        data: { quantity: { decrement: qty } },
      })

      await tx.sizeInventory.upsert({
        where: { productId_size_locationId: { productId, size, locationId: toLocationId } },
        update: { quantity: { increment: qty } },
        create: { productId, size, locationId: toLocationId, quantity: qty },
      })

      const { actorId, actorEmail } = await resolveActorFromSession(tx, session)

      const txnRow = await logInventoryTransaction(tx, {
        productId,
        size,
        type: 'transfer',
        quantity: qty,
        fromLocationId,
        toLocationId,
        actorId,
        actorEmail,
        note: noteTrimmed,
      })

      // Keep Product-level totals in sync with SizeInventory aggregates.
      await syncProductTotalsFromSizeInventory(tx, productId)

      return { transaction: txnRow, from: fromLoc.name, to: toLoc.name, sourceBefore, targetBefore: targetBefore ? { quantity: targetBefore.quantity } : null }
    })

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { tenantId: true } })
    const user = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      tenantId: product?.tenantId,
      action: 'inventory.transfer',
      entityType: 'SizeInventory',
      entityId: productId,
      actorId: user.adminId,
      actorType: 'admin',
      actorEmail: user.email,
      before: { source: result.sourceBefore, target: result.targetBefore },
      after: { source: result.sourceBefore ? { quantity: result.sourceBefore.quantity - qty } : undefined, target: { quantity: result.targetBefore ? result.targetBefore.quantity + qty : qty } },
      payload: { productId, size, fromLocationId, toLocationId, quantity: qty, note: noteTrimmed },
      note: noteTrimmed,
      req,
    })

    return NextResponse.json({ success: true, from: result.from, to: result.to, transaction: result.transaction })
  } catch (err) {
    const e = err as Error & { code?: string; available?: number }
    switch (e.code) {
      case 'PRODUCT_NOT_FOUND':
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      case 'SOURCE_LOCATION_INVALID':
        return NextResponse.json({ error: 'Source location does not exist or is inactive' }, { status: 400 })
      case 'DEST_LOCATION_INVALID':
        return NextResponse.json({ error: 'Destination location does not exist or is inactive' }, { status: 400 })
      case 'SOURCE_ROW_NOT_FOUND':
        return NextResponse.json({ error: 'No inventory for this size at the source location' }, { status: 404 })
      case 'INSUFFICIENT_STOCK':
        return NextResponse.json(
          { error: `Insufficient stock — only ${e.available} available at source location` },
          { status: 409 }
        )
      case 'HOLD_CONFLICT':
        return NextResponse.json({ error: e.message }, { status: 409 })
      default:
        console.error('[inventory/transfer] Unexpected error:', e.message)
        return NextResponse.json({ error: 'Failed to transfer inventory' }, { status: 500 })
    }
  }
}
