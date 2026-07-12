import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { authenticatePosRequest } from '@/lib/pos/auth'
import { checkRateLimit } from '@/lib/pos/rateLimit'
import { getMainStoreLocationId } from '@/lib/store-locations'
import { logInventoryTransaction } from '@/lib/inventory/logTransaction'
import { syncProductTotalsFromSizeInventory, computeProductStatus, isSizelessInventory } from '@/lib/inventory/availability'

export const dynamic = 'force-dynamic'

type IncomingItem = {
  productId?: string
  sku?: string
  size: string
  quantity: number
}

type PosTransactionBody = {
  externalId: string
  type: 'sale' | 'return'
  locationId?: string
  locationCode?: string
  items: IncomingItem[]
  occurredAt?: string
}

/**
 * POST /api/pos/transaction
 *
 * Webhook contract for a future stadium POS to sync sales/returns against
 * SizeInventory without further refactor. See Phase 9 spec.
 *
 * Auth: `Authorization: Bearer <api-key>` — bcrypt-compared against active
 * PosApiKey rows.
 * Idempotency: `externalId` is the dedupe key — replays return
 * { deduped: true, eventId } and never double-apply.
 */
export async function POST(req: Request) {
  const auth = await authenticatePosRequest(req)
  if (!auth.ok) return auth.response

  if (!checkRateLimit(auth.apiKey.id)) {
    return NextResponse.json({ error: 'Rate limit exceeded (50 rps per key)' }, { status: 429 })
  }

  const body = (await req.json().catch(() => null)) as PosTransactionBody | null
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { externalId, type, items, occurredAt } = body
  if (typeof externalId !== 'string' || !externalId.trim()) {
    return NextResponse.json({ error: 'externalId is required' }, { status: 400 })
  }
  if (type !== 'sale' && type !== 'return') {
    return NextResponse.json({ error: "type must be 'sale' or 'return'" }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required and must be non-empty' }, { status: 400 })
  }
  for (const item of items) {
    if (typeof item.size !== 'string' || !item.size.trim()) {
      return NextResponse.json({ error: 'Each item requires a non-empty size' }, { status: 400 })
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return NextResponse.json({ error: 'Each item requires a positive integer quantity' }, { status: 400 })
    }
    if (!item.productId && !item.sku) {
      return NextResponse.json({ error: 'Each item requires productId or sku' }, { status: 400 })
    }
  }

  // ── Dedupe check (outside the transaction — cheap read, avoids opening
  //    a transaction for the overwhelmingly common "already seen" replay). ──
  const existing = await prisma.posEvent.findUnique({ where: { externalId } })
  if (existing) {
    return NextResponse.json({ deduped: true, eventId: existing.id })
  }

  // Sale requires an explicit location; return defaults to the main store
  // (SEC-110) unless a location override is provided.
  let locationId = body.locationId ?? null
  if (!locationId && body.locationCode) {
    const loc = await prisma.storeLocation.findUnique({
      where: { code: body.locationCode },
      select: { id: true },
    })
    if (!loc) {
      return NextResponse.json({ error: `Unknown locationCode: ${body.locationCode}` }, { status: 400 })
    }
    locationId = loc.id
  }

  if (type === 'sale' && !locationId) {
    return NextResponse.json({ error: 'locationId or locationCode is required for sale transactions' }, { status: 400 })
  }
  if (type === 'return' && !locationId) {
    locationId = await getMainStoreLocationId()
  }

  const resolvedLocation = await prisma.storeLocation.findUnique({
    where: { id: locationId! },
    select: { id: true, code: true, active: true },
  })
  if (!resolvedLocation || !resolvedLocation.active) {
    return NextResponse.json({ error: 'Resolved location does not exist or is inactive' }, { status: 400 })
  }
  locationId = resolvedLocation.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Resolve productId per item (sku lookup where needed).
      const resolvedItems: { productId: string; productName: string; size: string; quantity: number }[] = []
      for (const item of items) {
        let productId = item.productId ?? null
        let product: { id: string; name: string } | null = null
        if (productId) {
          product = await tx.product.findUnique({ where: { id: productId }, select: { id: true, name: true } })
        } else if (item.sku) {
          // No dedicated SKU column exists yet — treat `sku` as an alias for
          // Product.slug (the only stable external-facing identifier today).
          product = await tx.product.findUnique({ where: { slug: item.sku }, select: { id: true, name: true } })
        }
        if (!product) {
          throw Object.assign(new Error(`Product not found for item (productId=${item.productId ?? ''} sku=${item.sku ?? ''})`), {
            code: 'ITEM_PRODUCT_NOT_FOUND',
            item,
          })
        }
        productId = product.id
        resolvedItems.push({ productId, productName: product.name, size: item.size, quantity: item.quantity })
      }

      const deltas: { productId: string; productName: string; size: string; quantity: number; newQty: number }[] = []

      if (type === 'sale') {
        // Validate availability for ALL items first so a partial failure
        // rolls back the whole transaction with a clear per-item report.
        const failures: { productId: string; size: string; requested: number; available: number }[] = []
        const rowsBySku = new Map<string, { quantity: number; heldQuantity: number; pickedQuantity: number } | null>()
        for (const it of resolvedItems) {
          const key = `${it.productId}::${it.size}`
          const row = await tx.sizeInventory.findUnique({
            where: { productId_size_locationId: { productId: it.productId, size: it.size, locationId: locationId! } },
            select: { quantity: true, heldQuantity: true, pickedQuantity: true },
          })
          rowsBySku.set(key, row)
          const available = row ? row.quantity - row.heldQuantity - row.pickedQuantity : 0
          if (!row || available < it.quantity) {
            failures.push({ productId: it.productId, size: it.size, requested: it.quantity, available })
          }
        }
        if (failures.length > 0) {
          throw Object.assign(new Error('OVERSELL'), { code: 'OVERSELL', failures })
        }

        for (const it of resolvedItems) {
          const updated = await tx.sizeInventory.update({
            where: { productId_size_locationId: { productId: it.productId, size: it.size, locationId: locationId! } },
            data: { quantity: { decrement: it.quantity } },
          })
          await logInventoryTransaction(tx, {
            productId: it.productId,
            size: it.size,
            type: 'sale',
            quantity: -it.quantity,
            fromLocationId: locationId!,
            actorEmail: `pos:${auth.apiKey.name}`,
            note: `externalId=${externalId}`,
          })
          deltas.push({
            productId: it.productId,
            productName: it.productName,
            size: it.size,
            quantity: -it.quantity,
            newQty: updated.quantity,
          })
        }
      } else {
        // RETURN — increment, upserting the row if it doesn't exist yet.
        for (const it of resolvedItems) {
          const updated = await tx.sizeInventory.upsert({
            where: { productId_size_locationId: { productId: it.productId, size: it.size, locationId: locationId! } },
            update: { quantity: { increment: it.quantity } },
            create: { productId: it.productId, size: it.size, locationId: locationId!, quantity: it.quantity },
          })
          await logInventoryTransaction(tx, {
            productId: it.productId,
            size: it.size,
            type: 'return',
            quantity: it.quantity,
            toLocationId: locationId!,
            actorEmail: `pos:${auth.apiKey.name}`,
            note: `externalId=${externalId}`,
          })
          deltas.push({
            productId: it.productId,
            productName: it.productName,
            size: it.size,
            quantity: it.quantity,
            newQty: updated.quantity,
          })
        }
      }

      // Sync Product-level totals and status for all affected products.
      const affectedProductIds = Array.from(new Set(resolvedItems.map((it) => it.productId)))
      for (const pid of affectedProductIds) {
        await syncProductTotalsFromSizeInventory(tx, pid)
        const product = await tx.product.findUnique({ where: { id: pid }, select: { quantity: true, heldQuantity: true, pickedQuantity: true, status: true } })
        const rows = await tx.sizeInventory.findMany({
          where: { productId: pid },
          select: { size: true, quantity: true, heldQuantity: true, pickedQuantity: true },
        })
        const productCounters = product ? { quantity: product.quantity, heldQuantity: product.heldQuantity, pickedQuantity: product.pickedQuantity } : null
        const newStatus = computeProductStatus(rows, product?.status ?? undefined, productCounters)
        if (newStatus && newStatus !== product?.status) {
          await tx.product.update({ where: { id: pid }, data: { status: newStatus } })
        }
      }

      const event = await tx.posEvent.create({
        data: {
          externalId,
          type,
          locationId,
          payload: body as unknown as Prisma.InputJsonValue,
          status: 'applied',
          apiKeyId: auth.apiKey.id,
        },
      })

      return { event, deltas }
    })

    return NextResponse.json({
      eventId: result.event.id,
      deltas: result.deltas,
      occurredAt: occurredAt ?? new Date().toISOString(),
    })
  } catch (err) {
    const e = err as Error & { code?: string; failures?: unknown; item?: unknown }

    // Race condition: two concurrent requests with the same externalId both
    // passed the pre-transaction dedupe read; the unique constraint on
    // PosEvent.externalId catches the loser here. Treat as a normal dedupe.
    if (e.code === 'P2002') {
      const raced = await prisma.posEvent.findUnique({ where: { externalId } })
      if (raced) return NextResponse.json({ deduped: true, eventId: raced.id })
    }

    if (e.code === 'OVERSELL') {
      // Record the rejection in PosEvent for audit purposes (best-effort,
      // outside the rolled-back transaction).
      await prisma.posEvent
        .create({
          data: {
            externalId,
            type,
            locationId,
            payload: body as unknown as Prisma.InputJsonValue,
            status: 'rejected',
            errorReason: 'OVERSELL',
            apiKeyId: auth.apiKey.id,
          },
        })
        .catch(() => {})
      return NextResponse.json(
        { error: 'Insufficient stock for one or more items', failures: e.failures },
        { status: 409 }
      )
    }

    if (e.code === 'ITEM_PRODUCT_NOT_FOUND') {
      await prisma.posEvent
        .create({
          data: {
            externalId,
            type,
            locationId,
            payload: body as unknown as Prisma.InputJsonValue,
            status: 'rejected',
            errorReason: e.message,
            apiKeyId: auth.apiKey.id,
          },
        })
        .catch(() => {})
      return NextResponse.json({ error: e.message, item: e.item }, { status: 404 })
    }

    console.error('[pos/transaction] Unexpected error:', e)
    return NextResponse.json({ error: 'Failed to process POS transaction' }, { status: 500 })
  }
}
