import { prisma } from '@/lib/prisma'
import { generateReservationCode } from '@/lib/utils'
import { getHoldReservationLocationId } from '@/lib/store-locations'
import { logInventoryTransaction } from '@/lib/inventory/logTransaction'
import { syncProductTotalsFromSizeInventory } from '@/lib/inventory/availability'

export type FinalStatus = 'PICKED_UP' | 'RELEASED' | 'EXPIRED'

/**
 * Resolves a hold with optional partial fulfillment.
 *
 * fulfilledQty behaviour:
 *  - undefined / equals holdQuantity → full pickup (PICKED_UP)
 *  - 0                               → release (RELEASED)
 *  - 1 … holdQuantity-1              → partial pickup:
 *       original hold → PICKED_UP for fulfilledQty
 *       new ACTIVE hold created for remainingQty
 */
export async function resolveHold(
  holdId: string,
  finalStatus: FinalStatus,
  adminId?: string,
  fulfilledQty?: number
) {
  const hold = await prisma.hold.findUniqueOrThrow({
    where: { id: holdId },
    include: { product: true, customer: true },
  })

  if (hold.status !== 'ACTIVE') throw new Error('HOLD_NOT_ACTIVE')

  // Defensive defaults for old/incomplete holds
  const holdQty = hold.holdQuantity ?? 1
  const unitPriceCents = hold.product.priceCents ?? 0
  const originalTotalCents =
    hold.totalPriceCents != null && hold.totalPriceCents > 0
      ? hold.totalPriceCents
      : unitPriceCents * holdQty

  // Determine actual fulfilled quantity
  const resolvedFulfilledQty = fulfilledQty !== undefined ? fulfilledQty : holdQty
  const remainingQty = holdQty - resolvedFulfilledQty
  const isPartial = resolvedFulfilledQty > 0 && resolvedFulfilledQty < holdQty
  const isRelease = resolvedFulfilledQty === 0

  // Recalculate final total based on fulfilled quantity
  const finalTotalCents = unitPriceCents * resolvedFulfilledQty

  const now = new Date()
  const effectiveStatus: FinalStatus =
    finalStatus === 'EXPIRED' ? 'EXPIRED' : isRelease ? 'RELEASED' : 'PICKED_UP'

  try {
  await prisma.$transaction(async (tx) => {
    // Validate adminId — if it doesn't exist in Admin table, treat as anonymous
    // (prevents FK violation when session holds a mock/stale admin ID like 'demo-admin')
    let resolvedAdminId: string | null = adminId ?? null
    if (resolvedAdminId) {
      const adminExists = await tx.admin.findUnique({ where: { id: resolvedAdminId }, select: { id: true } })
      if (!adminExists) resolvedAdminId = null
    }

    // Mark the original hold as resolved
    await tx.hold.update({
      where: { id: holdId },
      data: {
        status: effectiveStatus,
        ...(effectiveStatus === 'PICKED_UP' && { pickedUpAt: now }),
        ...(effectiveStatus === 'RELEASED' && { releasedAt: now }),
      },
    })

    // Update product counters
    if (effectiveStatus === 'PICKED_UP') {
      if (isPartial) {
        // Partial: fulfilledQty moves from held → picked.
        // The new hold created below will add remainingQty back to heldQuantity.
        await tx.product.update({
          where: { id: hold.productId },
          data: {
            heldQuantity: { decrement: resolvedFulfilledQty },
            pickedQuantity: { increment: resolvedFulfilledQty },
          },
        })
      } else {
        // Full pickup: all held qty moves to picked
        await tx.product.update({
          where: { id: hold.productId },
          data: {
            heldQuantity: { decrement: holdQty },
            pickedQuantity: { increment: holdQty },
          },
        })
      }
    } else {
      // RELEASED or EXPIRED: entire held qty returns to available
      await tx.product.update({
        where: { id: hold.productId },
        data: { heldQuantity: { decrement: holdQty } },
      })
    }

    // Size-level inventory counters — only when a size is tracked
    if (hold.size) {
      const locationId = await getHoldReservationLocationId(hold.isStadiumHold)
      const sizeRow = await tx.sizeInventory.findUnique({
        where: { productId_size_locationId: { productId: hold.productId, size: hold.size, locationId } },
      })
      if (sizeRow !== null) {
        if (effectiveStatus === 'PICKED_UP') {
          if (isPartial) {
            await tx.sizeInventory.update({
              where: { productId_size_locationId: { productId: hold.productId, size: hold.size, locationId } },
              data: {
                heldQuantity: { decrement: resolvedFulfilledQty },
                pickedQuantity: { increment: resolvedFulfilledQty },
              },
            })
          } else {
            await tx.sizeInventory.update({
              where: { productId_size_locationId: { productId: hold.productId, size: hold.size, locationId } },
              data: {
                heldQuantity: { decrement: holdQty },
                pickedQuantity: { increment: holdQty },
              },
            })
          }
        } else {
          // RELEASED or EXPIRED
          await tx.sizeInventory.update({
            where: { productId_size_locationId: { productId: hold.productId, size: hold.size, locationId } },
            data: { heldQuantity: { decrement: holdQty } },
          })
        }
      }

      // Append-only ledger entry: releasing/expiring a hold returns stock to
      // the available pool at the fulfilling location.
      if (effectiveStatus !== 'PICKED_UP') {
        await logInventoryTransaction(tx, {
          productId: hold.productId,
          size: hold.size,
          type: 'hold-release',
          quantity: holdQty,
          fromLocationId: locationId,
          note: `Hold ${hold.reservationCode} ${effectiveStatus.toLowerCase()}`,
        })
      }
    }

    // Product-level held/picked/quantity are denormalized aggregates over
    // SizeInventory. Resync from the (now-updated) SizeInventory rows so the
    // aggregate never drifts from the true per-size/location source of truth.
    const hasSizeRows = (await tx.sizeInventory.count({ where: { productId: hold.productId } })) > 0
    if (hasSizeRows) {
      await syncProductTotalsFromSizeInventory(tx, hold.productId)
    }

    // Create a new ACTIVE hold for remaining quantity (partial pickup only)
    if (isPartial) {
      const newCode = generateReservationCode()
      await tx.hold.create({
        data: {
          reservationCode: newCode,
          productId: hold.productId,
          customerId: hold.customerId,
          size: hold.size,
          holdQuantity: remainingQty,
          totalPriceCents: unitPriceCents * remainingQty,
          status: 'ACTIVE',
          placedAt: now,
          expiresAt: hold.expiresAt, // inherit original expiry
          notifiedStaffAt: null,
        },
      })
      // NOTE: Do NOT re-increment heldQuantity here.
      // The original hold's create already incremented heldQuantity by holdQuantity.
      // The partial resolve decremented only fulfilledQty (above), so remainingQty
      // is already correctly reflected in heldQuantity — the new hold inherits that slot.
    }

    // Recalculate product status AFTER all heldQuantity updates are complete
    const updatedProduct = await tx.product.findUniqueOrThrow({ where: { id: hold.productId }, select: { quantity: true, heldQuantity: true, pickedQuantity: true } })
    const available = updatedProduct.quantity - updatedProduct.heldQuantity - updatedProduct.pickedQuantity
    const newProductStatus = available <= 0 ? 'SOLD' : 'AVAILABLE'
    await tx.product.update({ where: { id: hold.productId }, data: { status: newProductStatus } })

    // HoldHistory record
    await tx.holdHistory.create({
      data: {
        holdId,
        reservationCode: hold.reservationCode,
        productId: hold.productId,
        productNameSnapshot: hold.product.name,
        productPriceCentsSnapshot: unitPriceCents,
        productImageUrlSnapshot: hold.product.imageUrl,
        customerId: hold.customerId,
        customerNameSnapshot: hold.customer.fullName,
        customerPhoneSnapshot: hold.customer.phone,
        holdQuantity: holdQty,
        fulfilledQuantity: resolvedFulfilledQty,
        totalPriceCentsSnapshot: originalTotalCents,
        finalTotalCents,
        placedAt: hold.placedAt,
        expiresAt: hold.expiresAt,
        finalStatus: effectiveStatus,
        resolvedAt: now,
        resolvedByAdminId: resolvedAdminId,
      },
    })

    // SalesHistory only when something was actually picked up
    if (effectiveStatus === 'PICKED_UP' && resolvedFulfilledQty > 0) {
      await tx.salesHistory.create({
        data: {
          holdId,
          reservationCode: hold.reservationCode,
          productId: hold.productId,
          productNameSnapshot: hold.product.name,
          salePriceCentsSnapshot: finalTotalCents, // fulfilled total only
          holdQuantity: holdQty,
          fulfilledQuantity: resolvedFulfilledQty,
          customerId: hold.customerId,
          customerPhoneSnapshot: hold.customer.phone,
          soldAt: now,
          soldByAdminId: resolvedAdminId,
        },
      })
    }

    await tx.auditLog.create({
      data: {
        action: `hold.${effectiveStatus.toLowerCase()}${isPartial ? '.partial' : ''}`,
        entityType: 'Hold',
        entityId: holdId,
        actorType: resolvedAdminId ? 'admin' : 'system',
        actorId: resolvedAdminId,
        payload: JSON.stringify({
          reservationCode: hold.reservationCode,
          productNameSnapshot: hold.product.name,
          productPriceCentsSnapshot: unitPriceCents,
          originalTotalCents,
          finalTotalCents,
          holdQuantity: holdQty,
          fulfilledQuantity: resolvedFulfilledQty,
          remainingQty: isPartial ? remainingQty : 0,
          customerPhoneSnapshot: hold.customer.phone,
        }),
      },
    })
  })
  } catch (txErr) {
    const e = txErr as Error
    console.error(
      '[resolveHold] Transaction failed',
      {
        holdId,
        finalStatus,
        fulfilledQty: resolvedFulfilledQty,
        holdQty,
        isPartial,
        isRelease,
        productId: hold.productId,
        customerId: hold.customerId,
      },
      e.message,
      e.stack
    )
    throw txErr
  }
}
