import { prisma } from '@/lib/prisma'
import { generateReservationCode } from '@/lib/utils'
import { getHoldReservationLocationId } from '@/lib/store-locations'
import { getHoldSettings } from '@/lib/holds/getHoldSettings'
import { isGameDay } from '@/lib/holds/isGameDay'
import { getEffectiveHoldHours } from '@/lib/holds/getEffectiveHoldHours'
import { logInventoryTransaction } from '@/lib/inventory/logTransaction'
import { autoExpireOverdueHolds } from '@/lib/holds/autoExpireHolds'
import { syncProductTotalsFromSizeInventory } from '@/lib/inventory/availability'

export async function createHold(
  productId: string,
  customerData: {
    fullName: string
    phone: string
    size?: string
    quantity?: number
    isStadiumHold?: boolean
  }
) {
  const qty = Math.max(1, customerData.quantity ?? 1)
  const isStadiumHold = customerData.isStadiumHold === true

  // Inline auto-expire: release any overdue holds back into sellable inventory
  // before checking availability, so stale ACTIVE holds never block a new
  // reservation between scheduled cron runs. Best-effort — never blocks creation.
  await autoExpireOverdueHolds().catch((err) => {
    console.error('[createHold] Inline auto-expire failed:', err)
  })

  const customer = await prisma.customer.upsert({
    where: { phone: customerData.phone },
    update: { fullName: customerData.fullName },
    create: { fullName: customerData.fullName, phone: customerData.phone },
  })

  const activeCount = await prisma.hold.count({
    where: { customerId: customer.id, status: 'ACTIVE' },
  })
  if (activeCount >= 3) throw new Error('HOLD_LIMIT_REACHED')

  const now = new Date()

  // Section 123 (Stadium Queue) holds are only permitted on active game days —
  // enforced server-side regardless of client state.
  const gameDay = await isGameDay(now)
  if (isStadiumHold && !gameDay) {
    throw Object.assign(new Error('SECTION_123_GAME_DAY_ONLY'), { code: 'SECTION_123_GAME_DAY_ONLY' })
  }

  // Effective hold duration comes from admin-configured HoldSettings:
  // stadium queue always uses the standard (shorter) window; the Gate 5
  // standard path gets the extended window only when enabled and not a game day.
  const settings = await getHoldSettings()
  const holdDurationHours = getEffectiveHoldHours(settings, gameDay, isStadiumHold)
  const expiresAt = new Date(now.getTime() + holdDurationHours * 60 * 60 * 1000)
  // Stadium holds get a pickup queue slot 30 minutes after creation
  const pickupQueueAt = isStadiumHold
    ? new Date(now.getTime() + 30 * 60 * 1000)
    : null
  const reservationCode = generateReservationCode()

  // The fulfilling location: Section 123 (pickup queue) for stadium holds,
  // Section 110 / Gate 5 (main store) for standard holds.
  const locationId = await getHoldReservationLocationId(isStadiumHold)

  const result = await prisma.$transaction(async (tx) => {
    // Re-check availability inside the transaction using heldQuantity, scoped
    // to the fulfilling location so a hold can never be placed against stock
    // that physically lives elsewhere (e.g. GATE-1 / other sections).
    const [product, hasSizeRowsAnywhere, sizeRows] = await Promise.all([
      tx.product.findUnique({ where: { id: productId } }),
      tx.sizeInventory.count({ where: { productId } }).then((c) => c > 0),
      tx.sizeInventory.findMany({
        where: { productId, locationId },
        select: { size: true, quantity: true, heldQuantity: true, pickedQuantity: true },
      }),
    ])
    if (!product) {
      throw Object.assign(new Error('ITEM_NOT_AVAILABLE'), { code: 'ITEM_NOT_AVAILABLE' })
    }

    const hasSizes = hasSizeRowsAnywhere

    // For size-tracked products use the sum of per-size available stock at
    // the fulfilling location; otherwise fall back to the product-level
    // aggregate fields. Both subtract pickedQuantity so already-sold units
    // never appear as available.
    const available = hasSizes
      ? sizeRows.reduce((sum, r) => sum + Math.max(0, r.quantity - r.heldQuantity - r.pickedQuantity), 0)
      : Math.max(0, product.quantity - product.heldQuantity - product.pickedQuantity)

    if (available <= 0 || qty > available) {
      throw Object.assign(new Error('ITEM_NOT_AVAILABLE'), { code: 'ITEM_NOT_AVAILABLE' })
    }

    // Size-level inventory check — only when a size is specified
    if (customerData.size) {
      const sizeRow = sizeRows.find((r) => r.size === customerData.size) ?? null
      // hasSizes but no row at this location means the size isn't stocked at
      // the chosen fulfillment location — reject rather than silently
      // skipping (which previously let holds through with no enforcement).
      if (hasSizes && sizeRow === null) {
        throw Object.assign(new Error('SIZE_NOT_AVAILABLE'), { code: 'SIZE_NOT_AVAILABLE' })
      }
      if (sizeRow !== null) {
        const sizeAvailable = sizeRow.quantity - sizeRow.heldQuantity - sizeRow.pickedQuantity
        if (sizeAvailable <= 0 || qty > sizeAvailable) {
          throw Object.assign(new Error('SIZE_NOT_AVAILABLE'), { code: 'SIZE_NOT_AVAILABLE' })
        }
        // Reserve at size level atomically — stadium holds draw from the
        // pickup queue (Section 123); standard holds draw from the main store.
        await tx.sizeInventory.update({
          where: { productId_size_locationId: { productId, size: customerData.size, locationId } },
          data: { heldQuantity: { increment: qty } },
        })
      }
    }

    const totalPriceCents = product.priceCents * qty

    const hold = await tx.hold.create({
      data: {
        reservationCode,
        productId,
        customerId: customer.id,
        size: customerData.size || null,
        holdQuantity: qty,
        totalPriceCents,
        status: 'ACTIVE',
        placedAt: now,
        expiresAt,
        isStadiumHold,
        pickupQueueAt,
      },
      include: { product: true, customer: true },
    })

    // Atomically increment product.heldQuantity
    await tx.product.update({
      where: { id: productId },
      data: { heldQuantity: { increment: qty } },
    })

    // Product-level held/picked/quantity are denormalized aggregates over
    // SizeInventory. Resync from the (now-updated) SizeInventory rows so the
    // aggregate never drifts from the true per-size/location source of truth.
    if (hasSizes) {
      await syncProductTotalsFromSizeInventory(tx, productId)
    }

    // Mark product as SOLD when all available stock is now held.
    // For size-tracked products use the updated size-level totals;
    // for non-size products use the product-level counter.
    let allHeld: boolean
    if (hasSizes) {
      const updatedSizeRows = await tx.sizeInventory.findMany({
        where: { productId },
        select: { quantity: true, heldQuantity: true, pickedQuantity: true },
      })
      allHeld = updatedSizeRows.every((r) => r.quantity - r.heldQuantity - r.pickedQuantity <= 0)
    } else {
      const updatedProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { quantity: true, heldQuantity: true, pickedQuantity: true },
      })
      allHeld = (updatedProduct?.heldQuantity ?? 0) + (updatedProduct?.pickedQuantity ?? 0) >= (updatedProduct?.quantity ?? 0)
    }
    if (allHeld) {
      await tx.product.update({ where: { id: productId }, data: { status: 'SOLD' } })
    }

    // Append-only ledger entry for this reservation at the fulfilling location.
    await logInventoryTransaction(tx, {
      productId,
      size: customerData.size ?? null,
      type: 'hold-reserve',
      quantity: qty,
      toLocationId: locationId,
      note: `Hold ${reservationCode}${isStadiumHold ? ' (stadium queue)' : ''}`,
    })

    await tx.auditLog.create({
      data: {
        action: 'hold.created',
        entityType: 'Hold',
        entityId: hold.id,
        actorType: 'customer',
        actorId: null,
        payload: JSON.stringify({
          reservationCode,
          productNameSnapshot: product.name,
          priceCentsSnapshot: product.priceCents,
          totalPriceCents,
          size: customerData.size,
          quantity: qty,
          isStadiumHold,
          pickupQueueAt: pickupQueueAt?.toISOString(),
        }),
      },
    })

    return hold
  })

  return result
}
