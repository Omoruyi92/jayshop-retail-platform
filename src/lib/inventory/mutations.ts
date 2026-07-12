import { prisma } from '@/lib/prisma'
import { logInventoryTransaction, resolveActorFromSession } from '@/lib/inventory/logTransaction'
import { syncProductTotalsFromSizeInventory, isSizelessInventory } from '@/lib/inventory/availability'
import type { Prisma } from '@prisma/client'

export type RestockInput = {
  productId: string
  addQty: number
  size?: string
  actorId?: string | null
  actorEmail?: string | null
  note?: string | null
}

/**
 * Centralized restock mutation.
 * - Adds stock to a specific SizeInventory row when size is provided.
 * - Adds stock to legacy Product.quantity when size is absent (simple products).
 * - Marks product AVAILABLE if it was SOLD and now has stock.
 * - Always syncs Product totals from SizeInventory when relevant.
 * - Logs transaction and emits event.
 */
export async function restock(input: RestockInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: { id: true, status: true, sizes: true, quantity: true, heldQuantity: true, pickedQuantity: true },
    })
    if (!product) throw Object.assign(new Error('PRODUCT_NOT_FOUND'), { code: 'PRODUCT_NOT_FOUND' })

    const mainStoreLocationId = await import('@/lib/store-locations').then((m) => m.getMainStoreLocationId())
    const hasExplicitSizes = !!(product.sizes && product.sizes.trim().length > 0)
    const hasSizeRows = (await tx.sizeInventory.count({ where: { productId: input.productId } })) > 0

    if (hasExplicitSizes || hasSizeRows) {
      if (!input.size) {
        throw Object.assign(new Error('SIZE_REQUIRED'), { code: 'SIZE_REQUIRED' })
      }
      const sizeRow = await tx.sizeInventory.findUnique({
        where: {
          productId_size_locationId: {
            productId: input.productId,
            size: input.size,
            locationId: mainStoreLocationId,
          },
        },
      })
      if (!sizeRow) {
        throw Object.assign(new Error('SIZE_NOT_FOUND'), { code: 'SIZE_NOT_FOUND' })
      }

      await tx.sizeInventory.update({
        where: {
          productId_size_locationId: {
            productId: input.productId,
            size: input.size,
            locationId: mainStoreLocationId,
          },
        },
        data: { quantity: { increment: input.addQty } },
      })

      await logInventoryTransaction(tx, {
        productId: input.productId,
        size: input.size,
        type: 'adjustment',
        quantity: input.addQty,
        toLocationId: mainStoreLocationId,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        note: input.note ?? `Restock +${input.addQty}`,
      })
    } else {
      // Simple product: legacy product-level quantity
      await tx.product.update({
        where: { id: input.productId },
        data: { quantity: { increment: input.addQty } },
      })
      await logInventoryTransaction(tx, {
        productId: input.productId,
        size: null,
        type: 'adjustment',
        quantity: input.addQty,
        toLocationId: mainStoreLocationId,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        note: input.note ?? `Restock +${input.addQty}`,
      })
    }

    await syncProductTotalsFromSizeInventory(tx, input.productId)

    const newStatus = await computeStatus(tx, input.productId, product.status)
    if (newStatus && newStatus !== product.status) {
      await tx.product.update({ where: { id: input.productId }, data: { status: newStatus } })
    }

    return { id: input.productId, quantityAdded: input.addQty, size: input.size ?? null }
  })
}

export type HoldReserveInput = {
  productId: string
  size?: string | null
  qty: number
  reservationCode: string
  pickupQueueLocationId: string
  actorId?: string | null
  actorEmail?: string | null
}

/**
 * Centralized hold reservation against SEC-123 SizeInventory.
 * Throws if size not available. Caller must have already verified qty against effective availability.
 */
export async function reserveHoldInventory(input: HoldReserveInput) {
  const { productId, size, qty, reservationCode, pickupQueueLocationId } = input
  if (qty <= 0) throw new Error('INVALID_QUANTITY')
  return prisma.$transaction(async (tx) => {
    const where = { productId_size_locationId: { productId, size: size ?? '__LEGACY__', locationId: pickupQueueLocationId } }

    // For sizeless products, reserve from product-level quantity instead of SizeInventory.
    if (size) {
      const sizeRow = await tx.sizeInventory.findUnique({ where })
      if (!sizeRow) throw Object.assign(new Error('SIZE_NOT_FOUND'), { code: 'SIZE_NOT_FOUND' })
      const available = sizeRow.quantity - sizeRow.heldQuantity - sizeRow.pickedQuantity
      if (available < qty) throw Object.assign(new Error('SIZE_NOT_AVAILABLE'), { code: 'SIZE_NOT_AVAILABLE' })

      await tx.sizeInventory.update({
        where,
        data: { heldQuantity: { increment: qty } },
      })
      await logInventoryTransaction(tx, {
        productId,
        size,
        type: 'hold-reserve',
        quantity: -qty,
        fromLocationId: pickupQueueLocationId,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        note: `Reservation ${reservationCode}`,
      })
    } else {
      // Sizeless product: decrement product-level quantity (reserve as held).
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { quantity: true, heldQuantity: true, pickedQuantity: true },
      })
      if (!product) throw Object.assign(new Error('PRODUCT_NOT_FOUND'), { code: 'PRODUCT_NOT_FOUND' })
      const available = Math.max(0, product.quantity - product.heldQuantity - product.pickedQuantity)
      if (available < qty) throw Object.assign(new Error('SIZE_NOT_AVAILABLE'), { code: 'SIZE_NOT_AVAILABLE' })

      await tx.product.update({
        where: { id: productId },
        data: { heldQuantity: { increment: qty } },
      })
    }

    await syncProductTotalsFromSizeInventory(tx, productId)
    const productStatus = await tx.product.findUnique({ where: { id: productId }, select: { status: true } })
    const newStatus = await computeStatus(tx, productId, productStatus?.status)
    if (newStatus && newStatus !== productStatus?.status) {
      await tx.product.update({ where: { id: productId }, data: { status: newStatus } })
    }
  })
}

export type HoldReleaseInput = {
  productId: string
  size?: string | null
  qty: number
  fromLocationId: string
  actorId?: string | null
  actorEmail?: string | null
  note?: string | null
}

/**
 * Centralized hold release: decrements heldQuantity atomically.
 * Safe to call even if SizeInventory row is missing (no-op).
 */
export async function releaseHoldInventory(input: HoldReleaseInput) {
  const { productId, size, qty, fromLocationId } = input
  if (qty <= 0) return
  return prisma.$transaction(async (tx) => {
    if (size) {
      const row = await tx.sizeInventory.findUnique({
        where: {
          productId_size_locationId: { productId, size, locationId: fromLocationId },
        },
      })
      if (row && row.heldQuantity > 0) {
        await tx.sizeInventory.update({
          where: { productId_size_locationId: { productId, size, locationId: fromLocationId } },
          data: { heldQuantity: { decrement: Math.min(qty, row.heldQuantity) } },
        })
        await logInventoryTransaction(tx, {
          productId,
          size,
          type: 'hold-release',
          quantity: qty,
          toLocationId: fromLocationId,
          actorId: input.actorId ?? null,
          actorEmail: input.actorEmail ?? null,
          note: input.note ?? 'Hold released/expire',
        })
      }
    } else {
      // Sizeless product: decrement product-level held quantity.
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { heldQuantity: true },
      })
      if (product && product.heldQuantity > 0) {
        await tx.product.update({
          where: { id: productId },
          data: { heldQuantity: { decrement: Math.min(qty, product.heldQuantity) } },
        })
      }
    }

    await syncProductTotalsFromSizeInventory(tx, productId)

    const productStatus = await tx.product.findUnique({ where: { id: productId }, select: { status: true } })
    const newStatus = await computeStatus(tx, productId, productStatus?.status)
    if (newStatus && newStatus !== productStatus?.status) {
      await tx.product.update({ where: { id: productId }, data: { status: newStatus } })
    }
  })
}

export type PickupInput = {
  productId: string
  size?: string | null
  qty: number
  locationId: string
  actorId?: string | null
  actorEmail?: string | null
  note?: string | null
}

/**
 * Centralized pickup / fulfillment: move qty from held to picked (permanent sale).
 */
export async function pickupInventory(input: PickupInput) {
  const { productId, size, qty, locationId } = input
  if (qty <= 0) return
  return prisma.$transaction(async (tx) => {
    if (size) {
      const row = await tx.sizeInventory.findUnique({
        where: { productId_size_locationId: { productId, size, locationId } },
      })
      if (!row || row.heldQuantity < qty) {
        throw Object.assign(new Error('HOLD_NOT_AVAILABLE'), { code: 'HOLD_NOT_AVAILABLE' })
      }
      await tx.sizeInventory.update({
        where: { productId_size_locationId: { productId, size, locationId } },
        data: {
          heldQuantity: { decrement: qty },
          pickedQuantity: { increment: qty },
        },
      })
      await logInventoryTransaction(tx, {
        productId,
        size,
        type: 'sale',
        quantity: qty,
        fromLocationId: locationId,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        note: input.note ?? 'Picked up / fulfilled',
      })
    } else {
      // Sizeless product: move qty from heldQuantity to pickedQuantity at product level.
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { heldQuantity: true, pickedQuantity: true },
      })
      if (!product || product.heldQuantity < qty) {
        throw Object.assign(new Error('HOLD_NOT_AVAILABLE'), { code: 'HOLD_NOT_AVAILABLE' })
      }
      await tx.product.update({
        where: { id: productId },
        data: {
          heldQuantity: { decrement: qty },
          pickedQuantity: { increment: qty },
        },
      })
    }

    await syncProductTotalsFromSizeInventory(tx, productId)

    const productStatus = await tx.product.findUnique({ where: { id: productId }, select: { status: true } })
    const newStatus = await computeStatus(tx, productId, productStatus?.status)
    if (newStatus && newStatus !== productStatus?.status) {
      await tx.product.update({ where: { id: productId }, data: { status: newStatus } })
    }
  })
}

/**
 * Compute product status from size inventory totals or product-level counters.
 */
async function computeStatus(
  tx: Prisma.TransactionClient,
  productId: string,
  currentStatus?: string | null
): Promise<'AVAILABLE' | 'SOLD' | undefined> {
  if (currentStatus === 'ARCHIVED') return undefined
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { quantity: true, heldQuantity: true, pickedQuantity: true, sizes: true },
  })
  if (!product) return undefined
  const rows = await tx.sizeInventory.findMany({
    where: { productId },
    select: { size: true, quantity: true, heldQuantity: true, pickedQuantity: true },
  })
  if (rows.length > 0 && !isSizelessInventory(rows)) {
    const available = rows.reduce((sum, r) => sum + Math.max(0, r.quantity - r.heldQuantity - r.pickedQuantity), 0)
    return available > 0 ? 'AVAILABLE' : 'SOLD'
  }
  const available = Math.max(0, product.quantity - product.heldQuantity - product.pickedQuantity)
  return available > 0 ? 'AVAILABLE' : 'SOLD'
}

/* ─── POS / Walk-up Sale ────────────────────────────────────────────────── */
export type SellInput = {
  productId: string
  size?: string | null
  qty: number
  locationId: string
  actorId?: string | null
  actorEmail?: string | null
  note?: string | null
}

/**
 * Centralized direct-sale: decrement SizeInventory.quantity at a location.
 * For sizeless products, decrement product.quantity directly.
 */
export async function sellInventory(input: SellInput, tx?: Prisma.TransactionClient) {
  const run = async (db: Prisma.TransactionClient) => {
    const { productId, size, qty, locationId } = input
    if (qty <= 0) return

    if (size) {
      await db.sizeInventory.update({
        where: { productId_size_locationId: { productId, size, locationId } },
        data: { quantity: { decrement: qty } },
      })
    } else {
      // Sizeless product: decrement product-level quantity as a direct sale.
      await db.product.update({
        where: { id: productId },
        data: { quantity: { decrement: qty } },
      })
    }

    await logInventoryTransaction(db, {
      productId,
      size: size ?? null,
      type: 'sale',
      quantity: -qty,
      fromLocationId: locationId,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      note: input.note ?? `POS sale -${qty}`,
    })
    await syncProductTotalsFromSizeInventory(db, productId)
    const product = await db.product.findUnique({ where: { id: productId }, select: { status: true } })
    const newStatus = await computeStatus(db, productId, product?.status)
    if (newStatus && newStatus !== product?.status) {
      await db.product.update({ where: { id: productId }, data: { status: newStatus } })
    }
  }
  if (tx) return run(tx)
  return prisma.$transaction(run)
}

export type ReturnInput = {
  productId: string
  size?: string | null
  qty: number
  locationId: string
  actorId?: string | null
  actorEmail?: string | null
  note?: string | null
}

/**
 * Centralized return: increment SizeInventory.quantity at a location (upsert).
 * For sizeless products, increment product.quantity directly.
 */
export async function returnInventory(input: ReturnInput, tx?: Prisma.TransactionClient) {
  const run = async (db: Prisma.TransactionClient) => {
    const { productId, size, qty, locationId } = input
    if (qty <= 0) return

    if (size) {
      await db.sizeInventory.upsert({
        where: { productId_size_locationId: { productId, size, locationId } },
        update: { quantity: { increment: qty } },
        create: { productId, size, locationId, quantity: qty, heldQuantity: 0, pickedQuantity: 0 },
      })
    } else {
      // Sizeless product: increment product-level quantity on return.
      await db.product.update({
        where: { id: productId },
        data: { quantity: { increment: qty } },
      })
    }

    await logInventoryTransaction(db, {
      productId,
      size: size ?? null,
      type: 'return',
      quantity: qty,
      toLocationId: locationId,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      note: input.note ?? `POS return +${qty}`,
    })
    await syncProductTotalsFromSizeInventory(db, productId)
    const product = await db.product.findUnique({ where: { id: productId }, select: { status: true } })
    const newStatus = await computeStatus(db, productId, product?.status)
    if (newStatus && newStatus !== product?.status) {
      await db.product.update({ where: { id: productId }, data: { status: newStatus } })
    }
  }
  if (tx) return run(tx)
  return prisma.$transaction(run)
}

/* ─── Inventory Transfer ────────────────────────────────────────────────── */
export type TransferInput = {
  productId: string
  size: string
  qty: number
  fromLocationId: string
  toLocationId: string
  actorId?: string | null
  actorEmail?: string | null
  note?: string | null
}

/**
 * Centralized transfer between locations: decrement source, upsert destination.
 */
export async function transferInventory(input: TransferInput, tx?: Prisma.TransactionClient) {
  const run = async (db: Prisma.TransactionClient) => {
    const { productId, size, qty, fromLocationId, toLocationId } = input
    if (qty <= 0) return
    // Decrement source
    await db.sizeInventory.update({
      where: { productId_size_locationId: { productId, size, locationId: fromLocationId } },
      data: { quantity: { decrement: qty } },
    })
    // Upsert destination
    await db.sizeInventory.upsert({
      where: { productId_size_locationId: { productId, size, locationId: toLocationId } },
      update: { quantity: { increment: qty } },
      create: { productId, size, locationId: toLocationId, quantity: qty, heldQuantity: 0, pickedQuantity: 0 },
    })
    await logInventoryTransaction(db, {
      productId,
      size,
      type: 'transfer',
      quantity: qty,
      fromLocationId,
      toLocationId,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      note: input.note ?? `Transfer ${qty} units`,
    })
    await syncProductTotalsFromSizeInventory(db, productId)
  }
  if (tx) return run(tx)
  return prisma.$transaction(run)
}
