import type { Prisma } from '@prisma/client'

export type InventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export type SizeDetail = {
  quantity: number
  held: number
  picked: number
  available: number
}

export type LocationAvailability = {
  locationId: string
  locationName: string
  locationSection: string | null
  locationGate: string | null
  isMainStore: boolean
  isPickupQueue: boolean
  sortOrder: number
  total: number
  held: number
  picked: number
  available: number
  sizeQuantities: Record<string, number>
  sizeDetail: Record<string, SizeDetail>
}

export type ProductAvailability = {
  /** @deprecated Use availableBalance for true availability; this is the raw SizeInventory.quantity sum. */
  totalAvailable: number
  status: InventoryStatus
  statusLabel: string
  displayText: string
  locationBreakdown: LocationAvailability[]
  totalQuantity: number
  reservedQuantity: number
  soldQuantity: number
  availableBalance: number
}

const LOW_STOCK_THRESHOLD = 10

const ONE_SIZE = 'ONE_SIZE'

function isSyntheticOneSizeRows(rows: Array<{ size: string }>): boolean {
  return rows.length === 1 && rows[0]?.size === ONE_SIZE
}

export function statusForTotal(quantity: number): InventoryStatus {
  if (quantity === 0) return 'out-of-stock'
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low-stock'
  return 'in-stock'
}

export function labelForStatus(status: InventoryStatus): string {
  switch (status) {
    case 'in-stock':
      return 'In Stock'
    case 'low-stock':
      return 'Low Stock'
    case 'out-of-stock':
      return 'Out of Stock'
  }
}

export function displayTextFor(available: number, statusLabel: string): string {
  if (available === 0) return 'Out of stock'
  if (available <= LOW_STOCK_THRESHOLD) return `Only ${available} left`
  return statusLabel
}

type InventoryRow = {
  quantity: number
  heldQuantity: number
  pickedQuantity: number
  size: string
  location: {
    id: string
    name: string
    section: string | null
    gate: string | null
    isMainStore: boolean
    isPickupQueue: boolean
    sortOrder: number
  }
}

export function buildAvailability(sizeInventories: InventoryRow[]): ProductAvailability {
  // If the product has no size rows, fall back to product-level quantity.
  // The caller can pass a single ONE_SIZE synthetic row in that case.
  const rows = sizeInventories.length > 0 ? sizeInventories : []

  const locationMap = new Map<string, LocationAvailability>()

  for (const row of rows) {
    const rowAvailable = Math.max(0, row.quantity - row.heldQuantity - row.pickedQuantity)
    const existing = locationMap.get(row.location.id)

    if (existing) {
      existing.total += row.quantity
      existing.held += row.heldQuantity
      existing.picked += row.pickedQuantity
      existing.available += rowAvailable
      existing.sizeQuantities[row.size] =
        (existing.sizeQuantities[row.size] ?? 0) + row.quantity
      const sd = existing.sizeDetail[row.size]
      if (sd) {
        sd.quantity += row.quantity
        sd.held += row.heldQuantity
        sd.picked += row.pickedQuantity
        sd.available += rowAvailable
      } else {
        existing.sizeDetail[row.size] = {
          quantity: row.quantity,
          held: row.heldQuantity,
          picked: row.pickedQuantity,
          available: rowAvailable,
        }
      }
    } else {
      locationMap.set(row.location.id, {
        locationId: row.location.id,
        locationName: row.location.name,
        locationSection: row.location.section,
        locationGate: row.location.gate,
        isMainStore: row.location.isMainStore,
        isPickupQueue: row.location.isPickupQueue,
        sortOrder: row.location.sortOrder,
        total: row.quantity,
        held: row.heldQuantity,
        picked: row.pickedQuantity,
        available: rowAvailable,
        sizeQuantities: { [row.size]: row.quantity },
        sizeDetail: {
          [row.size]: {
            quantity: row.quantity,
            held: row.heldQuantity,
            picked: row.pickedQuantity,
            available: rowAvailable,
          },
        },
      })
    }
  }

  const locationBreakdown = Array.from(locationMap.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder
  )

  const totalQuantity = locationBreakdown.reduce((sum, loc) => sum + loc.total, 0)
  const reservedQuantity = locationBreakdown.reduce((sum, loc) => sum + loc.held, 0)
  const soldQuantity = locationBreakdown.reduce((sum, loc) => sum + loc.picked, 0)
  const availableBalance = Math.max(0, totalQuantity - reservedQuantity - soldQuantity)

  const totalAvailable = totalQuantity
  const status = statusForTotal(availableBalance)
  const statusLabel = labelForStatus(status)
  const displayText = displayTextFor(availableBalance, statusLabel)

  return {
    totalAvailable,
    status,
    statusLabel,
    displayText,
    locationBreakdown,
    totalQuantity,
    reservedQuantity,
    soldQuantity,
    availableBalance,
  }
}

const LOCATION_SELECT = {
  id: true,
  name: true,
  section: true,
  gate: true,
  isMainStore: true,
  isPickupQueue: true,
  sortOrder: true,
} as const

export async function getProductAvailability(
  productId: string,
  tx?: Prisma.TransactionClient
): Promise<ProductAvailability> {
  const client = tx ?? (await import('@/lib/prisma')).prisma

  const [rows, product] = await Promise.all([
    client.sizeInventory.findMany({
      where: { productId },
      orderBy: [{ location: { sortOrder: 'asc' } }, { size: 'asc' }],
      select: {
        quantity: true,
        heldQuantity: true,
        pickedQuantity: true,
        size: true,
        location: { select: LOCATION_SELECT },
      },
    }),
    client.product.findUnique({
      where: { id: productId },
      select: { id: true, quantity: true, heldQuantity: true, pickedQuantity: true, sizes: true, status: true },
    }),
  ])

  // No size-inventory rows means a simple product: treat Product.quantity as a single ONE_SIZE row.
  // If a single ONE_SIZE row already exists from a legacy sync, still fall back to Product.quantity
  // as the source of truth.
  if ((rows.length === 0 || isSyntheticOneSizeRows(rows)) && product) {
    const mainStoreLocationId = await import('@/lib/store-locations').then((m) => m.getMainStoreLocationId())
    return buildAvailability([
      {
        quantity: product.quantity,
        heldQuantity: product.heldQuantity,
        pickedQuantity: product.pickedQuantity,
        size: ONE_SIZE,
        location: {
          id: mainStoreLocationId,
          name: 'Main Store',
          section: null,
          gate: null,
          isMainStore: true,
          isPickupQueue: false,
          sortOrder: 0,
        },
      },
    ])
  }

  return buildAvailability(rows)
}

export async function getManyProductsAvailability(
  productIds: string[],
  tx?: Prisma.TransactionClient
): Promise<Record<string, ProductAvailability>> {
  const client = tx ?? (await import('@/lib/prisma')).prisma
  const mainStoreLocationId = await import('@/lib/store-locations').then((m) => m.getMainStoreLocationId())

  const [rows, products] = await Promise.all([
    client.sizeInventory.findMany({
      where: { productId: { in: productIds } },
      orderBy: [{ location: { sortOrder: 'asc' } }, { size: 'asc' }],
      select: {
        productId: true,
        quantity: true,
        heldQuantity: true,
        pickedQuantity: true,
        size: true,
        location: { select: LOCATION_SELECT },
      },
    }),
    client.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, quantity: true, heldQuantity: true, pickedQuantity: true, sizes: true },
    }),
  ])

  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = grouped.get(row.productId) ?? []
    list.push(row)
    grouped.set(row.productId, list)
  }

  const productMap = new Map(products.map((p) => [p.id, p]))

  const result: Record<string, ProductAvailability> = {}
  for (const id of productIds) {
    const productRows = grouped.get(id)
    const hasRealSizes = productRows && productRows.length > 0 && !isSyntheticOneSizeRows(productRows)
    if (!hasRealSizes) {
      const product = productMap.get(id)
      result[id] = buildAvailability(
        product
          ? [
              {
                quantity: product.quantity,
                heldQuantity: product.heldQuantity,
                pickedQuantity: product.pickedQuantity,
                size: ONE_SIZE,
                location: {
                  id: mainStoreLocationId,
                  name: 'Main Store',
                  section: null,
                  gate: null,
                  isMainStore: true,
                  isPickupQueue: false,
                  sortOrder: 0,
                },
              },
            ]
          : []
      )
    } else {
      result[id] = buildAvailability(productRows!)
    }
  }

  return result
}
