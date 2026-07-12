/**
 * Shared inventory health threshold convention (used across shop, availability
 * API, and admin analytics):
 *   quantity === 0   -> 'out'     (red)
 *   quantity 1..3    -> 'low'     (yellow)
 *   quantity > 3     -> 'healthy' (green)
 */
export type InventoryStatus = 'out' | 'low' | 'healthy'

export function statusForQuantity(quantity: number): InventoryStatus {
  if (quantity === 0) return 'out'
  if (quantity <= 3) return 'low'
  return 'healthy'
}

/** Rolls up a set of rows (each with a quantity) into an aggregate red/yellow/green status. */
export function rollupStatus(hasOut: boolean, hasLow: boolean): 'red' | 'yellow' | 'green' {
  if (hasOut) return 'red'
  if (hasLow) return 'yellow'
  return 'green'
}
