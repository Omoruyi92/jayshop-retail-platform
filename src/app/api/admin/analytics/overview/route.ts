import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'
import { autoExpireOverdueHolds } from '@/lib/holds/autoExpireHolds'
import { rollupStatus } from '@/lib/inventory/status'
import { getManyProductsAvailability, statusForTotal } from '@/lib/inventory/aggregate'

export const dynamic = 'force-dynamic'

// ─── In-memory 30s cache ─────────────────────────────────────────────────────
// Simple process-local cache; fine for a single-instance admin dashboard.
// Avoids recomputing the (several) aggregate queries on every dashboard poll.
let cachedPayload: unknown = null
let cachedAt = 0
const CACHE_TTL_MS = 30_000

const SIZE_ORDER = ['S', 'M', 'L', 'XL', '2XL', '3XL']
function sizeSortIndex(size: string): number {
  const idx = SIZE_ORDER.indexOf(size)
  return idx === -1 ? SIZE_ORDER.length : idx
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'analytics:read')
  if (error) return error

  const now = Date.now()
  if (cachedPayload && now - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(cachedPayload)
  }

  // Ensure any overdue ACTIVE holds are resolved before computing numbers.
  await autoExpireOverdueHolds()

  const nowDate = new Date()
  const since24h = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000)
  const since30d = new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    locations,
    products,
    sizeInventoryRows,
    activeHoldsCount,
    expiredHolds24hCount,
    section123ReservedAgg,
    activeHolds,
    expiredHolds24h,
    salesLast30d,
    holdReserveLast30d,
  ] = await Promise.all([
    prisma.storeLocation.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true, name: true, isMainStore: true, isPickupQueue: true },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, slug: true, imageUrl: true },
    }),
    prisma.sizeInventory.findMany({
      select: {
        productId: true,
        locationId: true,
        size: true,
        quantity: true,
        heldQuantity: true,
        pickedQuantity: true,
      },
    }),
    prisma.hold.count({ where: { status: 'ACTIVE' } }),
    prisma.hold.count({
      where: { status: 'EXPIRED', releasedAt: { gte: since24h } },
    }),
    prisma.sizeInventory.aggregate({
      where: { location: { isPickupQueue: true } },
      _sum: { heldQuantity: true },
    }),
    prisma.hold.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        productId: true,
        size: true,
        expiresAt: true,
        product: { select: { name: true } },
      },
      orderBy: { expiresAt: 'asc' },
      take: 50,
    }),
    prisma.hold.findMany({
      where: { status: 'EXPIRED', releasedAt: { gte: since24h } },
      select: {
        id: true,
        productId: true,
        size: true,
        expiresAt: true,
        product: { select: { name: true } },
      },
      orderBy: { releasedAt: 'desc' },
      take: 50,
    }),
    prisma.inventoryTransaction.findMany({
      where: { type: 'sale', createdAt: { gte: since30d } },
      select: {
        productId: true,
        quantity: true,
        createdAt: true,
        product: { select: { name: true } },
        toLocation: { select: { code: true } },
        fromLocation: { select: { code: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.inventoryTransaction.findMany({
      where: { type: 'hold-reserve', createdAt: { gte: since30d } },
      select: { productId: true, quantity: true },
    }),
  ])

  // ── Aggregated availability from centralized service ─────────────────────
  const availabilityMap = await getManyProductsAvailability(products.map((p) => p.id))

  // ── Product/location lookup maps ──────────────────────────────────────────
  const productMap = new Map(products.map((p) => [p.id, p]))
  const locationMap = new Map(locations.map((l) => [l.id, l]))

  // ── byLocation ─────────────────────────────────────────────────────────────
  type LocAgg = {
    locationId: string
    code: string
    name: string
    isMainStore: boolean
    isPickupQueue: boolean
    totalUnits: number
    distinctProducts: Set<string>
    lowSizes: number
    outSizes: number
  }
  const locAggMap = new Map<string, LocAgg>()
  for (const loc of locations) {
    locAggMap.set(loc.id, {
      locationId: loc.id,
      code: loc.code,
      name: loc.name,
      isMainStore: loc.isMainStore,
      isPickupQueue: loc.isPickupQueue,
      totalUnits: 0,
      distinctProducts: new Set(),
      lowSizes: 0,
      outSizes: 0,
    })
  }

  // ── byProduct ──────────────────────────────────────────────────────────────
  type ProdAgg = {
    productId: string
    name: string
    slug: string
    imageUrl: string
    totalUnits: number
    locationIds: Set<string>
    lowSizes: number
    outSizes: number
  }
  const prodAggMap = new Map<string, ProdAgg>()
  for (const p of products) {
    prodAggMap.set(p.id, {
      productId: p.id,
      name: p.name,
      slug: p.slug,
      imageUrl: p.imageUrl,
      totalUnits: 0,
      locationIds: new Set(),
      lowSizes: 0,
      outSizes: 0,
    })
  }

  // ── bySize ─────────────────────────────────────────────────────────────────
  type SizeAgg = { size: string; totalUnits: number; lowRows: number; outRows: number }
  const sizeAggMap = new Map<string, SizeAgg>()

  const lowStock: { productId: string; name: string; size: string; locationCode: string; quantity: number }[] = []
  const outOfStock: { productId: string; name: string; size: string; locationCode: string }[] = []

  for (const row of sizeInventoryRows) {
    // Use available balance (quantity - held - picked) with the same
    // threshold as the shop-facing/admin availability service (aggregate.ts)
    // so analytics low/out-of-stock detection matches the badges shown
    // elsewhere (product list, inventory modal, PDP).
    const available = Math.max(0, row.quantity - row.heldQuantity - row.pickedQuantity)
    const availStatus = statusForTotal(available)
    const status = availStatus === 'low-stock' ? 'low' : availStatus === 'out-of-stock' ? 'out' : 'healthy'
    const loc = locationMap.get(row.locationId)
    const prod = productMap.get(row.productId)

    // byLocation
    const locAgg = locAggMap.get(row.locationId)
    if (locAgg) {
      locAgg.totalUnits += row.quantity
      locAgg.distinctProducts.add(row.productId)
      if (status === 'low') locAgg.lowSizes++
      if (status === 'out') locAgg.outSizes++
    }

    // byProduct (low/out row counts only – totalUnits comes from aggregate service)
    const prodAgg = prodAggMap.get(row.productId)
    if (prodAgg) {
      prodAgg.locationIds.add(row.locationId)
      if (status === 'low') prodAgg.lowSizes++
      if (status === 'out') prodAgg.outSizes++
    }

    // bySize
    if (!sizeAggMap.has(row.size)) {
      sizeAggMap.set(row.size, { size: row.size, totalUnits: 0, lowRows: 0, outRows: 0 })
    }
    const sizeAgg = sizeAggMap.get(row.size)!
    sizeAgg.totalUnits += row.quantity
    if (status === 'low') sizeAgg.lowRows++
    if (status === 'out') sizeAgg.outRows++

    // low / out lists
    if (status === 'low' && prod && loc) {
      lowStock.push({ productId: row.productId, name: prod.name, size: row.size, locationCode: loc.code, quantity: available })
    }
    if (status === 'out' && prod && loc) {
      outOfStock.push({ productId: row.productId, name: prod.name, size: row.size, locationCode: loc.code })
    }
  }

  const byLocation = Array.from(locAggMap.values())
    .map((l) => ({
      locationId: l.locationId,
      code: l.code,
      name: l.name,
      isMainStore: l.isMainStore,
      isPickupQueue: l.isPickupQueue,
      totalUnits: l.totalUnits,
      distinctProducts: l.distinctProducts.size,
      lowSizes: l.lowSizes,
      outSizes: l.outSizes,
      status: rollupStatus(l.outSizes > 0, l.lowSizes > 0),
    }))
    // preserve seed sortOrder (locations array is already ordered)
    .sort((a, b) => locations.findIndex((l) => l.id === a.locationId) - locations.findIndex((l) => l.id === b.locationId))

  const STATUS_SEVERITY: Record<string, number> = { red: 0, yellow: 1, green: 2 }
  const byProduct = Array.from(prodAggMap.values())
    .map((p) => {
      const availability = availabilityMap[p.productId]
      return {
        productId: p.productId,
        name: p.name,
        slug: p.slug,
        imageUrl: p.imageUrl,
        totalUnits: availability?.totalAvailable ?? p.totalUnits,
        locationCount: p.locationIds.size,
        lowSizes: p.lowSizes,
        outSizes: p.outSizes,
        status: rollupStatus(p.outSizes > 0, p.lowSizes > 0),
      }
    })
    .sort((a, b) => STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status] || b.totalUnits - a.totalUnits)

  const bySize = Array.from(sizeAggMap.values()).sort((a, b) => sizeSortIndex(a.size) - sizeSortIndex(b.size))

  lowStock.sort((a, b) => a.quantity - b.quantity)
  const lowStockTop20 = lowStock.slice(0, 20)
  const outOfStockTop20 = outOfStock.slice(0, 20)

  // ── recentlySold (empty until Phase 9's 'sale' transactions exist) ────────
  const recentlySold = salesLast30d.slice(0, 20).map((s) => ({
    productId: s.productId,
    name: s.product?.name ?? 'Unknown',
    quantity: Math.abs(s.quantity),
    at: s.createdAt.toISOString(),
    locationCode: s.fromLocation?.code ?? s.toLocation?.code ?? '—',
  }))

  // ── popular (sale + hold-reserve, last 30d) ───────────────────────────────
  const popularMap = new Map<string, { name: string; unitsMoved: number }>()
  for (const s of salesLast30d) {
    const key = s.productId
    const name = s.product?.name ?? productMap.get(s.productId)?.name ?? 'Unknown'
    const entry = popularMap.get(key) ?? { name, unitsMoved: 0 }
    entry.unitsMoved += Math.abs(s.quantity)
    popularMap.set(key, entry)
  }
  for (const h of holdReserveLast30d) {
    const key = h.productId
    const name = productMap.get(h.productId)?.name ?? 'Unknown'
    const entry = popularMap.get(key) ?? { name, unitsMoved: 0 }
    entry.unitsMoved += Math.abs(h.quantity)
    popularMap.set(key, entry)
  }
  const popular = Array.from(popularMap.entries())
    .map(([productId, v]) => ({ productId, name: v.name, unitsMoved: v.unitsMoved }))
    .sort((a, b) => b.unitsMoved - a.unitsMoved)
    .slice(0, 10)

  // ── activeHolds / expiredHolds lists ──────────────────────────────────────
  const activeHoldsOut = activeHolds.map((h) => ({
    holdId: h.id,
    productId: h.productId,
    productName: h.product.name,
    size: h.size,
    locationCode: locations.find((l) => l.isMainStore)?.code ?? '—',
    expiresAt: h.expiresAt.toISOString(),
  }))
  const expiredHoldsOut = expiredHolds24h.map((h) => ({
    holdId: h.id,
    productId: h.productId,
    productName: h.product.name,
    size: h.size,
    expiresAt: h.expiresAt.toISOString(),
  }))

  // ── totals (derived from centralized aggregate service) ─────────────────
  const totalInventoryUnits = Object.values(availabilityMap).reduce((sum, a) => sum + a.totalAvailable, 0)

  const payload = {
    totals: {
      inventory: totalInventoryUnits,
      products: products.length,
      locations: locations.length,
      activeHolds: activeHoldsCount,
      expiredHolds: expiredHolds24hCount,
      pickupReservedForSection123: section123ReservedAgg._sum.heldQuantity ?? 0,
    },
    byLocation,
    byProduct,
    bySize,
    lowStock: lowStockTop20,
    outOfStock: outOfStockTop20,
    recentlySold,
    popular,
    activeHolds: activeHoldsOut,
    expiredHolds: expiredHoldsOut,
  }

  cachedPayload = payload
  cachedAt = now

  return NextResponse.json(payload)
}
