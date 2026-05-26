import { prisma } from '@/lib/prisma'
import { generateReservationCode } from '@/lib/utils'

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
  // Stadium holds expire in 24h; standard holds expire in 48h
  const holdDurationHours = isStadiumHold ? 24 : 48
  const expiresAt = new Date(now.getTime() + holdDurationHours * 60 * 60 * 1000)
  // Stadium holds get a pickup queue slot 30 minutes after creation
  const pickupQueueAt = isStadiumHold
    ? new Date(now.getTime() + 30 * 60 * 1000)
    : null
  const reservationCode = generateReservationCode()

  const result = await prisma.$transaction(async (tx) => {
    // Re-check availability inside the transaction using heldQuantity
    const [product, sizeRows] = await Promise.all([
      tx.product.findUnique({ where: { id: productId } }),
      tx.sizeInventory.findMany({
        where: { productId },
        select: { size: true, quantity: true, heldQuantity: true },
      }),
    ])
    if (!product) {
      throw Object.assign(new Error('ITEM_NOT_AVAILABLE'), { code: 'ITEM_NOT_AVAILABLE' })
    }

    const hasSizes = sizeRows.length > 0

    // For size-tracked products use the sum of per-size available stock;
    // otherwise fall back to the product-level field so the availability
    // check is consistent with what the shop UI shows.
    const available = hasSizes
      ? sizeRows.reduce((sum, r) => sum + Math.max(0, r.quantity - r.heldQuantity), 0)
      : Math.max(0, product.quantity - product.heldQuantity)

    if (available <= 0 || qty > available) {
      throw Object.assign(new Error('ITEM_NOT_AVAILABLE'), { code: 'ITEM_NOT_AVAILABLE' })
    }

    // Size-level inventory check — only when a size is specified
    if (customerData.size) {
      const sizeRow = sizeRows.find((r) => r.size === customerData.size) ?? null
      // If the row exists, enforce size-level availability
      if (sizeRow !== null) {
        const sizeAvailable = sizeRow.quantity - sizeRow.heldQuantity
        if (sizeAvailable <= 0 || qty > sizeAvailable) {
          throw Object.assign(new Error('SIZE_NOT_AVAILABLE'), { code: 'SIZE_NOT_AVAILABLE' })
        }
        // Reserve at size level atomically
        await tx.sizeInventory.update({
          where: { productId_size: { productId, size: customerData.size } },
          data: { heldQuantity: { increment: qty } },
        })
      }
      // If no SizeInventory row exists for this size, skip size-level check (graceful degradation)
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
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { heldQuantity: { increment: qty } },
    })

    // Mark product as SOLD when all available stock is now held.
    // For size-tracked products use the updated size-level totals;
    // for non-size products use the product-level counter.
    let allHeld: boolean
    if (hasSizes) {
      const updatedSizeRows = await tx.sizeInventory.findMany({
        where: { productId },
        select: { quantity: true, heldQuantity: true },
      })
      allHeld = updatedSizeRows.every((r) => r.quantity - r.heldQuantity <= 0)
    } else {
      allHeld = updatedProduct.heldQuantity >= updatedProduct.quantity
    }
    if (allHeld) {
      await tx.product.update({ where: { id: productId }, data: { status: 'SOLD' } })
    }

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
