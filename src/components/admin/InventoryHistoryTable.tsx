'use client'
import { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { useInventoryStream } from '@/hooks/useInventoryStream'
import { ClearHistoryModal } from '@/components/admin/ClearHistoryModal'
import { useCurrentAdmin } from '@/hooks/useCurrentAdmin'

export interface InventoryHistoryRow {
  id: string
  createdAt: string
  type: string
  quantity: number
  size: string
  note: string | null
  actorEmail: string | null
  product: { id: string; name: string; slug: string }
  fromLocation: { id: string; code: string; name: string } | null
  toLocation: { id: string; code: string; name: string } | null
}

const TYPE_STYLES: Record<string, string> = {
  transfer:      'bg-blue-100 text-blue-700',
  sale:          'bg-green-100 text-green-700',
  return:        'bg-teal-100 text-teal-700',
  'hold-reserve': 'bg-amber-100 text-amber-700',
  'hold-release': 'bg-slate-100 text-slate-700',
  adjustment:    'bg-purple-100 text-purple-700',
  assign:        'bg-emerald-100 text-emerald-700',
  remove:        'bg-red-100 text-red-700',
}

const ALL_TYPES = ['transfer', 'adjustment', 'sale', 'return', 'hold-reserve', 'hold-release', 'assign', 'remove']

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', TYPE_STYLES[type] ?? 'bg-gray-100 text-gray-500')}>
      {type.replace(/-/g, ' ')}
    </span>
  )
}

interface InventoryHistoryTableProps {
  /** When set, locks the productId filter and hides the product input (per-product sub-view). */
  fixedProductId?: string
  /** Optional label shown next to the fixed product filter. */
  fixedProductLabel?: string
}

export function InventoryHistoryTable({ fixedProductId, fixedProductLabel }: InventoryHistoryTableProps) {
  const { can } = useCurrentAdmin()
  const [rows, setRows] = useState<InventoryHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null])
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)

  const [productId, setProductId] = useState(fixedProductId ?? '')
  const [locationId, setLocationId] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [locations, setLocations] = useState<{ id: string; code: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/store-locations')
      .then((r) => r.json())
      .then((d) => setLocations(d.locations ?? d ?? []))
      .catch(() => {})
  }, [])

  const currentCursor = cursorStack[cursorStack.length - 1]

  const buildParams = useCallback(
    (cursor: string | null) => {
      const p = new URLSearchParams()
      if (productId) p.set('productId', productId)
      if (locationId) p.set('locationId', locationId)
      if (selectedTypes.length > 0) p.set('type', selectedTypes.join(','))
      if (from) p.set('from', from)
      if (to) p.set('to', to)
      p.set('limit', '50')
      if (cursor) p.set('cursor', cursor)
      return p
    },
    [productId, locationId, selectedTypes, from, to]
  )

  const load = useCallback(
    (cursor: string | null) => {
      setLoading(true)
      setError(null)
      fetch(`/api/admin/inventory/history?${buildParams(cursor)}`)
        .then((r) => {
          if (!r.ok) throw new Error(`Request failed (${r.status})`)
          return r.json()
        })
        .then((d) => {
          setRows(d.rows ?? [])
          setHasMore(d.hasMore ?? false)
          setNextCursor(d.nextCursor ?? null)
        })
        .catch(() => {
          setRows([])
          setHasMore(false)
          setNextCursor(null)
          setError('Unable to load inventory history. Please try again.')
        })
        .finally(() => setLoading(false))
    },
    [buildParams]
  )

  useEffect(() => {
    setCursorStack([null])
    load(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, locationId, selectedTypes, from, to])

  // Real-time push: any inventory mutation (matching fixedProductId if set)
  // refreshes the currently-viewed page within ~1s. Only refresh while on
  // page 1 (cursorStack.length === 1) so a live event doesn't yank an admin
  // mid-pagination back to the top.
  useInventoryStream(
    { productId: fixedProductId },
    {
      onInventoryChanged: () => {
        if (cursorStack.length === 1) load(null)
      },
    }
  )

  function toggleType(t: string) {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function goNext() {
    if (!nextCursor) return
    const newStack = [...cursorStack, nextCursor]
    setCursorStack(newStack)
    load(nextCursor)
  }

  function goPrev() {
    if (cursorStack.length <= 1) return
    const newStack = cursorStack.slice(0, -1)
    setCursorStack(newStack)
    load(newStack[newStack.length - 1])
  }

  const clearParams = (() => {
    const p = buildParams(null)
    p.delete('limit'); p.delete('cursor')
    return Object.fromEntries(p)
  })()
  const hasActiveFilters = Object.keys(clearParams).length > 0
  const filterSummaryParts: string[] = []
  if (productId) filterSummaryParts.push(`Product: ${productId}`)
  if (locationId) filterSummaryParts.push(`Location: ${locationId}`)
  if (selectedTypes.length > 0) filterSummaryParts.push(`Types: ${selectedTypes.join(', ')}`)
  if (from) filterSummaryParts.push(`From ${from}`)
  if (to) filterSummaryParts.push(`To ${to}`)

  return (
    <div>
      {showClearModal && (
        <ClearHistoryModal
          title="Clear Inventory History"
          itemLabel="inventory transaction records"
          endpoint="/api/admin/inventory/history/clear"
          filteredParams={clearParams}
          hasFilters={hasActiveFilters}
          filterSummary={filterSummaryParts.join(' · ')}
          onClose={() => setShowClearModal(false)}
          onCleared={(deleted) => {
            toast.success(`Cleared ${deleted} inventory transaction${deleted === 1 ? '' : 's'}`)
            setCursorStack([null])
            load(null)
          }}
        />
      )}
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-5 overflow-x-auto">
        <div className="flex flex-wrap gap-3 items-end min-w-max sm:min-w-0">
          {!fixedProductId && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Product ID</label>
              <input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Filter by product…"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy w-48"
              />
            </div>
          )}
          {fixedProductId && fixedProductLabel && (
            <div className="text-sm text-jays-steel">
              Product: <span className="font-semibold text-jays-navy">{fixedProductLabel}</span>
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy"
            >
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.code} — {l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy" />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <div className="flex flex-wrap gap-1.5 max-w-md">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={cn(
                    'px-2 py-1 rounded-lg text-xs border transition-colors',
                    selectedTypes.includes(t)
                      ? 'bg-jays-navy text-white border-jays-navy'
                      : 'bg-white border-gray-200 text-jays-steel hover:bg-gray-50'
                  )}
                >
                  {t.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          {!fixedProductId && can('inventory-history:delete') && (
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-2 border border-jays-red text-jays-red px-4 py-2 rounded-xl text-sm font-semibold hover:bg-jays-red/5 transition-colors"
              >
                <Trash2 size={16} />
                Clear History
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Timestamp</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Product</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Size</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Type</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">From → To</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Delta</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Actor</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : error ? (
              <tr><td colSpan={8}><EmptyState title={error} /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No inventory transactions found" /></td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="hover:bg-jays-ice/50 transition-colors">
                <td className="px-4 py-3 text-jays-steel text-xs whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString('en-CA')}
                </td>
                <td className="px-4 py-3 font-medium">{r.product.name}</td>
                <td className="px-4 py-3 uppercase text-xs font-semibold">{r.size}</td>
                <td className="px-4 py-3"><TypeBadge type={r.type} /></td>
                <td className="px-4 py-3 text-xs text-jays-steel whitespace-nowrap">
                  {(r.fromLocation?.code ?? '—')} → {(r.toLocation?.code ?? '—')}
                </td>
                <td className={cn('px-4 py-3 font-bold text-sm', r.quantity > 0 ? 'text-green-600' : 'text-red-600')}>
                  {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
                </td>
                <td className="px-4 py-3 text-jays-steel text-xs">{r.actorEmail ?? 'system'}</td>
                <td className="px-4 py-3 text-jays-steel text-xs max-w-[200px] truncate">{r.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrapper>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <button
          disabled={cursorStack.length <= 1}
          onClick={goPrev}
          className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
        >
          &larr; Previous
        </button>
        <button
          disabled={!hasMore}
          onClick={goNext}
          className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
        >
          Load more &rarr;
        </button>
      </div>
    </div>
  )
}
