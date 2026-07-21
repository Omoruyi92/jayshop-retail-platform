import type { Prisma } from '@prisma/client'
import { LOW_STOCK_THRESHOLD } from '@/lib/constants'

export type InventoryStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export type SizeDetail = {
  quantity: number
  held: number
  picked: number
  available: number
  status: InventoryStatus
  statusLabel: string
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
  status: InventoryStatus
  statusLabel: string
  sizeQuantities: Record<string, number>
  sizeDetail: Record<string, SizeDetail>
}

export type StockAlertDetail = {
  locationId: string
  locationName: string
  size: string
  available: number
  status: InventoryStatus
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
  /**
   * Worst-case status across every individual size/location combination.
   * Unlike `status` (based on the summed availableBalance across all
   * locations), this surfaces a low/out condition even when the product's
   * total stock looks healthy overall but a specific size at a specific
   * location has run low or out. Use this for admin-facing alerts; keep
   * `status` for customer-facing checkout gating.
   */
  worstStatus: InventoryStatus
  worstStatusLabel: string
  lowStockDetails: StockAlertDetail[]
  outOfStockDetails: StockAlertDetail[]
}

const ONE_SIZE = 'ONE_SIZE'

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
        sd.status = statusForTotal(sd.available)
        sd.statusLabel = labelForStatus(sd.status)
      } else {
        const sizeStatus = statusForTotal(rowAvailable)
        existing.sizeDetail[row.size] = {
          quantity: row.quantity,
          held: row.heldQuantity,
          picked: row.pickedQuantity,
          available: rowAvailable,
          status: sizeStatus,
          statusLabel: labelForStatus(sizeStatus),
        }
      }
    } else {
      const sizeStatus = statusForTotal(rowAvailable)
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
        status: sizeStatus,
        statusLabel: labelForStatus(sizeStatus),
        sizeQuantities: { [row.size]: row.quantity },
        sizeDetail: {
          [row.size]: {
            quantity: row.quantity,
            held: row.heldQuantity,
            picked: row.pickedQuantity,
            available: rowAvailable,
            status: sizeStatus,
            statusLabel: labelForStatus(sizeStatus),
          },
        },
      })
    }
  }

  // Recompute each location's aggregate status now that all sizes are rolled up.
  Array.from(locationMap.values()).forEach((loc) => {
    loc.status = statusForTotal(loc.available)
    loc.statusLabel = labelForStatus(loc.status)
  })

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

  // ── Worst-case per size/location rollup ───────────────────────────────
  // Surfaces a size that's genuinely low/out at a specific location even
  // when the product's summed availableBalance still looks healthy.
  const lowStockDetails: StockAlertDetail[] = []
  const outOfStockDetails: StockAlertDetail[] = []
  for (const loc of locationBreakdown) {
    for (const [size, sd] of Object.entries(loc.sizeDetail)) {
      if (sd.status === 'out-of-stock') {
        outOfStockDetails.push({ locationId: loc.locationId, locationName: loc.locationName, size, available: sd.available, status: sd.status })
      } else if (sd.status === 'low-stock') {
        lowStockDetails.push({ locationId: loc.locationId, locationName: loc.locationName, size, available: sd.available, status: sd.status })
      }
    }
  }
  const worstStatus: InventoryStatus =
    outOfStockDetails.length > 0 ? 'out-of-stock' : lowStockDetails.length > 0 ? 'low-stock' : 'in-stock'
  const worstStatusLabel = labelForStatus(worstStatus)

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
    worstStatus,
    worstStatusLabel,
    lowStockDetails,
    outOfStockDetails,
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

  // No size-inventory rows at all means a not-yet-migrated simple product:
  // treat Product.quantity as a single synthetic ONE_SIZE row. Once real
  // SizeInventory rows exist (including a genuine ONE_SIZE row per location
  // for sizeless products), those rows are always the source of truth.
  if (rows.length === 0 && product) {
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
    const hasRealSizes = productRows && productRows.length > 0
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
