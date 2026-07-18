import type { Prisma } from '@prisma/client'

const ONE_SIZE = 'ONE_SIZE'

/**
 * Single source of truth for "available" quantity at the size-location level.
 * Returns effective available units (quantity minus held and picked).
 */
export function effectiveAvailable(row: {
  quantity: number
  heldQuantity: number
  pickedQuantity: number
}): number {
  return Math.max(0, row.quantity - row.heldQuantity - row.pickedQuantity)
}

/**
 * Aggregate available units across size rows for a product/location scope.
 * Caller must pass rows from Prisma; this never reads from Product.quantity.
 */
export function aggregateAvailable(
  rows: Array<{
    quantity: number
    heldQuantity: number
    pickedQuantity: number
  }>
): number {
  return rows.reduce((sum, r) => sum + effectiveAvailable(r), 0)
}

/**
 * Recompute and return product-level totals from SizeInventory rows.
 * Totals cover ALL locations so Product.quantity stays in sync with real stock.
 */
export function aggregateProductTotals(
  rows: Array<{
    quantity: number
    heldQuantity: number
    pickedQuantity: number
  }>
): { quantity: number; heldQuantity: number; pickedQuantity: number } {
  return rows.reduce(
    (acc, r) => {
      acc.quantity += r.quantity
      acc.heldQuantity += r.heldQuantity
      acc.pickedQuantity += r.pickedQuantity
      return acc
    },
    { quantity: 0, heldQuantity: 0, pickedQuantity: 0 }
  )
}

function isSyntheticOneSizeRow(rows: Array<{ size?: string }>): boolean {
  return rows.length === 1 && rows[0]?.size === ONE_SIZE
}

/**
 * Returns true when the product has no real size-level inventory tracking.
 */
export function isSizelessInventory(rows: Array<{ size?: string }>): boolean {
  return rows.length === 0 || isSyntheticOneSizeRow(rows)
}

/**
 * Sync Product.quantity/heldQuantity/pickedQuantity from SizeInventory.
 * Run inside a transaction that already performed inventory mutations.
 *
 * Products with at least one SizeInventory row (sized, or sizeless products
 * tracked via a single ONE_SIZE row) always derive their totals from those
 * rows — SizeInventory is the single source of truth. Only products with
 * zero SizeInventory rows anywhere (not yet migrated) keep Product-level
 * counters untouched.
 */
export async function syncProductTotalsFromSizeInventory(
  tx: Prisma.TransactionClient,
  productId: string
): Promise<void> {
  const rows = await tx.sizeInventory.findMany({
    where: { productId },
    select: { size: true, quantity: true, heldQuantity: true, pickedQuantity: true },
  })

  if (rows.length === 0) {
    // No SizeInventory rows exist yet for this product — leave Product-level
    // counters as the source of truth (legacy path, pre-migration).
    return
  }

  const totals = aggregateProductTotals(rows)
  await tx.product.update({
    where: { id: productId },
    data: totals,
  })
}

/**
 * Compute AVAILABLE/SOLD status for a product from its SizeInventory rows
 * or product-level counters when no size rows exist.
 */
export function computeProductStatus(
  rows: Array<{ quantity: number; heldQuantity: number; pickedQuantity: number; size?: string }>,
  currentStatus?: string,
  productCounters?: { quantity: number; heldQuantity: number; pickedQuantity: number } | null
): 'AVAILABLE' | 'SOLD' | undefined {
  if (currentStatus === 'ARCHIVED') return undefined
  if (rows.length === 0) {
    const available = productCounters
      ? Math.max(0, productCounters.quantity - productCounters.heldQuantity - productCounters.pickedQuantity)
      : 0
    return available > 0 ? 'AVAILABLE' : 'SOLD'
  }
  const available = aggregateAvailable(rows)
  return available > 0 ? 'AVAILABLE' : 'SOLD'
}
