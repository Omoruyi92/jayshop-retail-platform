'use client'
import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { useInventoryStream } from '@/hooks/useInventoryStream'

type HealthStatus = 'red' | 'yellow' | 'green'

interface Totals {
  inventory: number
  products: number
  locations: number
  activeHolds: number
  expiredHolds: number
  pickupReservedForSection123: number
}

interface LocationRow {
  locationId: string
  code: string
  name: string
  isMainStore: boolean
  isPickupQueue: boolean
  totalUnits: number
  distinctProducts: number
  lowSizes: number
  outSizes: number
  status: HealthStatus
}

interface ProductRow {
  productId: string
  name: string
  slug: string
  imageUrl: string
  totalUnits: number
  locationCount: number
  lowSizes: number
  outSizes: number
  status: HealthStatus
}

interface SizeRow {
  size: string
  totalUnits: number
  lowRows: number
  outRows: number
}

interface LowStockRow {
  productId: string
  name: string
  size: string
  locationCode: string
  quantity: number
}

interface OutOfStockRow {
  productId: string
  name: string
  size: string
  locationCode: string
}

interface RecentlySoldRow {
  productId: string
  name: string
  quantity: number
  at: string
  locationCode: string
}

interface PopularRow {
  productId: string
  name: string
  unitsMoved: number
}

interface ActiveHoldRow {
  holdId: string
  productId: string
  productName: string
  size: string | null
  locationCode: string
  expiresAt: string
}

interface ExpiredHoldRow {
  holdId: string
  productId: string
  productName: string
  size: string | null
  expiresAt: string
}

interface OverviewData {
  totals: Totals
  byLocation: LocationRow[]
  byProduct: ProductRow[]
  bySize: SizeRow[]
  lowStock: LowStockRow[]
  outOfStock: OutOfStockRow[]
  recentlySold: RecentlySoldRow[]
  popular: PopularRow[]
  activeHolds: ActiveHoldRow[]
  expiredHolds: ExpiredHoldRow[]
}

const STATUS_DOT: Record<HealthStatus, string> = {
  red: 'bg-jays-red',
  yellow: 'bg-amber-500',
  green: 'bg-green-500',
}
const STATUS_LABEL: Record<HealthStatus, string> = {
  red: 'Out of Stock',
  yellow: 'Low Stock',
  green: 'Healthy',
}
const STATUS_TEXT_CLASS: Record<HealthStatus, string> = {
  red: 'text-jays-red',
  yellow: 'text-amber-600',
  green: 'text-green-600',
}

function StatusPill({ status }: { status: HealthStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', STATUS_TEXT_CLASS[status])}>
      <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </span>
  )
}

const PRODUCTS_PAGE_SIZE = 50

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [productsPage, setProductsPage] = useState(1)
  const loadRef = useRef<(silent?: boolean) => void>(() => {})

  useEffect(() => {
    let cancelled = false

    function load(silent = false) {
      if (!silent) setLoading(true)
      fetch('/api/admin/analytics/overview')
        .then((r) => {
          if (!r.ok) throw new Error('Failed to load analytics')
          return r.json()
        })
        .then((d) => {
          if (!cancelled) {
            setData(d)
            setError(null)
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.message ?? 'Failed to load analytics')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    loadRef.current = load
    load(false)

    // Cross-view sync: refetch on tab focus and every 60s so this page never
    // disagrees with /admin/holds or the fan-facing pages on hold status.
    // Real-time push (below) handles the common case within ~1s; this
    // interval is only a fallback for when the SSE connection is down.
    const onVis = () => {
      if (document.visibilityState === 'visible') load(true)
    }
    document.addEventListener('visibilitychange', onVis)
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') load(true)
    }, 60000)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(intervalId)
    }
  }, [])

  // Real-time push: any hold or inventory mutation refreshes analytics
  // within ~1s.
  useInventoryStream(
    {},
    {
      onHoldChanged: () => loadRef.current(true),
      onInventoryChanged: () => loadRef.current(true),
    }
  )

  const selectedLocation = useMemo(
    () => data?.byLocation.find((l) => l.locationId === selectedLocationId) ?? null,
    [data, selectedLocationId]
  )

  const filteredLowStock = useMemo(() => {
    if (!data) return []
    if (!selectedLocation) return data.lowStock
    return data.lowStock.filter((r) => r.locationCode === selectedLocation.code)
  }, [data, selectedLocation])

  const filteredOutOfStock = useMemo(() => {
    if (!data) return []
    if (!selectedLocation) return data.outOfStock
    return data.outOfStock.filter((r) => r.locationCode === selectedLocation.code)
  }, [data, selectedLocation])

  // byProduct arrives from the API already sorted by status severity
  // (out-of-stock first) across the full product set. We only slice for
  // display here — pagination must never re-sort or re-derive severity.
  const totalProducts = data?.byProduct.length ?? 0
  const totalProductPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PAGE_SIZE))
  const clampedProductsPage = Math.min(Math.max(1, productsPage), totalProductPages)

  const pagedProducts = useMemo(() => {
    if (!data) return []
    const start = (clampedProductsPage - 1) * PRODUCTS_PAGE_SIZE
    return data.byProduct.slice(start, start + PRODUCTS_PAGE_SIZE)
  }, [data, clampedProductsPage])

  if (loading || !data) {
    return (
      <div>
        <AdminBackButton />
        <div className="text-jays-steel text-sm p-10 text-center">
          {error ? `Error: ${error}` : 'Loading analytics…'}
        </div>
      </div>
    )
  }

  const { totals, byLocation, bySize, recentlySold, popular, activeHolds, expiredHolds } = data

  const maxSizeUnits = Math.max(1, ...bySize.map((s) => s.totalUnits))

  return (
    <div>
      <AdminBackButton />
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Inventory Analytics</h1>
          <p className="text-jays-steel text-sm mt-1">Live inventory health across all 12 locations</p>
        </div>
      </div>

      {/* 1. KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total Inventory Units', value: totals.inventory },
          { label: 'Total Products', value: totals.products },
          { label: 'Locations Active', value: totals.locations },
          { label: 'Active Holds', value: totals.activeHolds },
          { label: 'Expired Holds (24h)', value: totals.expiredHolds },
          { label: 'Section 123 Reserved', value: totals.pickupReservedForSection123 },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-jays-steel text-xs uppercase tracking-wide font-medium mb-1 leading-tight">{kpi.label}</p>
            <p className="font-display text-2xl font-bold text-jays-navy">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 2. Location health grid */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">Location Health</h2>
          {selectedLocation && (
            <button
              onClick={() => setSelectedLocationId(null)}
              className="text-xs text-jays-steel hover:text-jays-navy underline"
            >
              Clear filter ({selectedLocation.code})
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {byLocation.map((loc) => {
            const active = selectedLocationId === loc.locationId
            return (
              <button
                key={loc.locationId}
                onClick={() => setSelectedLocationId(active ? null : loc.locationId)}
                className={cn(
                  'text-left rounded-xl border p-3 transition-colors',
                  active ? 'border-jays-navy bg-jays-ice' : 'border-border hover:bg-jays-ice/50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-jays-navy truncate">{loc.code}</span>
                  <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', STATUS_DOT[loc.status])} />
                </div>
                <p className="text-[11px] text-jays-steel truncate mb-1">
                  {loc.name}
                  {loc.isMainStore && ' · Main'}
                  {loc.isPickupQueue && ' · Pickup'}
                </p>
                <p className="text-lg font-display font-bold text-jays-navy leading-none">{loc.totalUnits}</p>
                <p className="text-[10px] text-jays-steel mt-1">
                  {loc.lowSizes} low · {loc.outSizes} out
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3 & 4. Low stock / Out of stock tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <TableWrapper>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">Low Stock</h2>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {filteredLowStock.length} shown
            </span>
          </div>
          {filteredLowStock.length === 0 ? (
            <EmptyState title="No low-stock rows" />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-jays-ice/50">
                <tr className="text-left">
                  <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Product</th>
                  <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Size</th>
                  <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Location</th>
                  <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLowStock.map((r, i) => (
                  <tr key={`${r.productId}-${r.size}-${r.locationCode}-${i}`} className="hover:bg-jays-ice/50 transition-colors">
                    <td className="px-4 py-2 font-medium truncate max-w-[220px]">{r.name}</td>
                    <td className="px-4 py-2 uppercase text-xs font-semibold">{r.size}</td>
                    <td className="px-4 py-2 text-xs text-jays-steel">{r.locationCode}</td>
                    <td className="px-4 py-2 font-bold text-amber-600">{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableWrapper>

        <TableWrapper>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">Out of Stock</h2>
            <span className="text-xs bg-red-100 text-jays-red px-2 py-0.5 rounded-full font-medium">
              {filteredOutOfStock.length} shown
            </span>
          </div>
          {filteredOutOfStock.length === 0 ? (
            <EmptyState title="No out-of-stock rows" />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-jays-ice/50">
                <tr className="text-left">
                  <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Product</th>
                  <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Size</th>
                  <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOutOfStock.map((r, i) => (
                  <tr key={`${r.productId}-${r.size}-${r.locationCode}-${i}`} className="hover:bg-jays-ice/50 transition-colors">
                    <td className="px-4 py-2 font-medium truncate max-w-[220px]">{r.name}</td>
                    <td className="px-4 py-2 uppercase text-xs font-semibold">{r.size}</td>
                    <td className="px-4 py-2 text-xs text-jays-steel">{r.locationCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableWrapper>
      </div>

      {/* 5. Products table */}
      <TableWrapper className="mb-6">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">Products</h2>
          <p className="text-xs text-jays-steel mt-0.5">Sorted by status severity (out-of-stock first)</p>
        </div>
        {totalProducts === 0 ? (
          <EmptyState title="No products" />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-jays-ice/50">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Product</th>
                <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Total Units</th>
                <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Locations</th>
                <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagedProducts.map((p) => (
                <tr key={p.productId} className="hover:bg-jays-ice/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg bg-jays-ice shrink-0 overflow-hidden"
                        style={{ backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      />
                      <span className="font-medium truncate max-w-[280px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-jays-navy">{p.totalUnits}</td>
                  <td className="px-4 py-2.5 text-jays-steel">{p.locationCount}</td>
                  <td className="px-4 py-2.5"><StatusPill status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalProducts > PRODUCTS_PAGE_SIZE && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-jays-ice/30">
            <span className="text-xs text-jays-steel">
              Showing {(clampedProductsPage - 1) * PRODUCTS_PAGE_SIZE + 1}–
              {Math.min(clampedProductsPage * PRODUCTS_PAGE_SIZE, totalProducts)} of {totalProducts}
            </span>
            <div className="flex items-center gap-3">
              <button
                disabled={clampedProductsPage <= 1}
                onClick={() => setProductsPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-jays-navy disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
              >
                &larr; Previous
              </button>
              <span className="text-xs text-jays-steel">Page {clampedProductsPage} of {totalProductPages}</span>
              <button
                disabled={clampedProductsPage >= totalProductPages}
                onClick={() => setProductsPage((p) => Math.min(totalProductPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-jays-navy disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </TableWrapper>

      {/* 6. By-size chart (pure Tailwind stacked bars) */}
      <div className="bg-white rounded-2xl border border-border p-5 mb-6">
        <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-4">Units by Size</h2>
        {bySize.length === 0 ? (
          <p className="text-jays-steel text-sm text-center py-8">No size data.</p>
        ) : (
          <div className="space-y-3">
            {bySize.map((s) => {
              // Bar total width scales with this size's share of overall units.
              const barWidthPct = Math.max(4, Math.round((s.totalUnits / maxSizeUnits) * 100))
              // Within the bar, split proportionally by row-count severity
              // (out rows / low rows / remaining healthy rows) rather than raw units,
              // since low/out counts are row-based per the threshold convention.
              const totalRows = s.lowRows + s.outRows
              const outSegPct = barWidthPct * (totalRows > 0 ? s.outRows / (totalRows + 1) : 0)
              const lowSegPct = barWidthPct * (totalRows > 0 ? s.lowRows / (totalRows + 1) : 0)
              const healthySegPct = Math.max(0, barWidthPct - outSegPct - lowSegPct)
              return (
                <div key={s.size} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-bold text-jays-navy uppercase shrink-0">{s.size}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden flex">
                    <div className="h-full bg-jays-red" style={{ width: `${outSegPct}%` }} />
                    <div className="h-full bg-amber-400" style={{ width: `${lowSegPct}%` }} />
                    <div className="h-full bg-green-500" style={{ width: `${healthySegPct}%` }} />
                  </div>
                  <span className="w-16 text-xs font-semibold text-jays-navy text-right shrink-0">{s.totalUnits} u</span>
                  <span className="w-24 text-[10px] text-jays-steel text-right shrink-0">{s.lowRows} low · {s.outRows} out</span>
                </div>
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-4 mt-4 text-[11px] text-jays-steel">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Healthy units</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Low rows</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-jays-red" /> Out rows</span>
        </div>
      </div>

      {/* 7. Recently sold / Popular products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-4">Recently Sold</h2>
          {recentlySold.length === 0 ? (
            <p className="text-jays-steel text-sm text-center py-8">No sales data yet.</p>
          ) : (
            <div className="space-y-2">
              {recentlySold.map((r, i) => (
                <div key={`${r.productId}-${i}`} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.name}</p>
                    <p className="text-xs text-jays-steel">{r.locationCode} · {new Date(r.at).toLocaleString('en-CA')}</p>
                  </div>
                  <span className="font-bold text-jays-navy shrink-0">{r.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-5">
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-4">Popular Products (30d)</h2>
          {popular.length === 0 ? (
            <p className="text-jays-steel text-sm text-center py-8">No sales or hold activity yet.</p>
          ) : (
            <div className="space-y-2">
              {popular.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs text-jays-steel w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-jays-navy rounded-full"
                        style={{ width: `${Math.round((p.unitsMoved / popular[0].unitsMoved) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-jays-navy shrink-0">{p.unitsMoved}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8. Active vs Expired holds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">Active Holds</h2>
            <Link href="/admin/holds" className="text-xs text-jays-navy hover:underline font-medium">View all →</Link>
          </div>
          {activeHolds.length === 0 ? (
            <EmptyState title="No active holds" />
          ) : (
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {activeHolds.map((h) => (
                <div key={h.holdId} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{h.productName}</p>
                    <p className="text-xs text-jays-steel">
                      {h.size ? <span className="uppercase font-semibold">{h.size}</span> : '—'} · {h.locationCode}
                    </p>
                  </div>
                  <span className="text-xs text-jays-steel shrink-0">
                    Expires {new Date(h.expiresAt).toLocaleString('en-CA')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">Expired Holds (24h)</h2>
            <Link href="/admin/holds" className="text-xs text-jays-navy hover:underline font-medium">View all →</Link>
          </div>
          {expiredHolds.length === 0 ? (
            <EmptyState title="No holds expired in the last 24h" />
          ) : (
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {expiredHolds.map((h) => (
                <div key={h.holdId} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{h.productName}</p>
                    <p className="text-xs text-jays-steel">
                      {h.size ? <span className="uppercase font-semibold">{h.size}</span> : '—'}
                    </p>
                  </div>
                  <span className="text-xs text-jays-steel shrink-0">
                    Expired {new Date(h.expiresAt).toLocaleString('en-CA')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
