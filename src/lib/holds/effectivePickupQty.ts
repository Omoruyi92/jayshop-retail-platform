import { prisma } from '@/lib/prisma'

/**
 * Effective quantity for a product + size at a specific location.
 * Uses SizeInventory.quantity minus heldQuantity minus pickedQuantity
 * for the chosen reservation location.
 */
export async function effectivePickupQty(
  productId: string,
  size: string,
  locationId: string
): Promise<number> {
  const sizeRow = await prisma.sizeInventory.findUnique({
    where: { productId_size_locationId: { productId, size, locationId } },
    select: { quantity: true, heldQuantity: true, pickedQuantity: true },
  })

  if (!sizeRow) return 0

  return Math.max(0, sizeRow.quantity - sizeRow.heldQuantity - sizeRow.pickedQuantity)
}
