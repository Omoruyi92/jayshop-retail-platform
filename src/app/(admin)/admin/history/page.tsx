'use client'
import { useState, useEffect, useCallback } from 'react'
import { formatCAD } from '@/lib/utils'
import { Download } from 'lucide-react'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface HistoryRow {
  id: string
  reservationCode: string
  productNameSnapshot: string
  productPriceCentsSnapshot: number
  totalPriceCentsSnapshot: number
  finalTotalCents: number | null
  holdQuantity: number
  fulfilledQuantity: number | null
  customerNameSnapshot: string
  customerPhoneSnapshot: string
  placedAt: string
  resolvedAt: string
  finalStatus: string
  resolvedBy?: { email: string } | null
}

const FINAL_STATUSES = ['', 'PICKED_UP', 'RELEASED', 'EXPIRED']

export default function AdminHistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [finalStatus, setFinalStatus] = useState('')
  const [phone, setPhone] = useState('')
  const [product, setProduct] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const buildParams = useCallback(() => {
    const p = new URLSearchParams()
    if (dateFrom) p.set('dateFrom', dateFrom)
    if (dateTo) p.set('dateTo', dateTo)
    if (finalStatus) p.set('finalStatus', finalStatus)
    if (phone) p.set('phone', phone)
    if (product) p.set('product', product)
    if (showArchived) p.set('showArchived', 'true')
    p.set('page', String(page))
    p.set('limit', '50')
    return p
  }, [dateFrom, dateTo, finalStatus, phone, product, showArchived, page])

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/history?${buildParams()}`)
      .then((r) => r.json())
      .then((d) => { setRows(d.rows ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [buildParams])

  useEffect(() => { load() }, [load])

  function handleExport() {
    const p = buildParams()
    p.delete('page'); p.delete('limit')
    window.location.href = `/api/admin/history/export?${p}`
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Hold History</h1>
          <p className="text-jays-steel text-sm mt-1">Immutable record of every completed hold — snapshots preserved</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-jays-navy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 mb-5 overflow-x-auto">
      <div className="flex flex-wrap gap-3 items-end min-w-max sm:min-w-0">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={finalStatus} onChange={(e) => { setFinalStatus(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy">
            {FINAL_STATUSES.map(s => <option key={s} value={s}>{s || 'All'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Phone</label>
          <input value={phone} onChange={(e) => { setPhone(e.target.value); setPage(1) }} placeholder="416-555…"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy w-32" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Product</label>
          <input value={product} onChange={(e) => { setProduct(e.target.value); setPage(1) }} placeholder="Jersey…"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy w-32" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showArchived} onChange={(e) => { setShowArchived(e.target.checked); setPage(1) }} className="w-4 h-4 accent-jays-navy" />
          Show archived
        </label>
      </div>
      </div>

      <div className="text-xs text-jays-steel mb-3">{total} records</div>

      {/* Table */}
      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Code</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Product</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Hold Qty</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Fulfilled</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Final Total</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Customer</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Phone</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Placed</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Resolved</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Status</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Resolved By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={11}><EmptyState title="No history records found" /></td></tr>
            ) : rows.map((r) => {
              const displayTotal = r.finalTotalCents ?? (r.totalPriceCentsSnapshot > 0 ? r.totalPriceCentsSnapshot : r.productPriceCentsSnapshot * (r.holdQuantity ?? 1))
              const displayFulfilled = r.fulfilledQuantity ?? (r.finalStatus === 'PICKED_UP' ? r.holdQuantity : null)
              return (
                <tr key={r.id} className="hover:bg-jays-ice/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">{r.reservationCode}</td>
                  <td className="px-4 py-3 font-medium">{r.productNameSnapshot}</td>
                  <td className="px-4 py-3 font-bold text-jays-navy text-sm">{r.holdQuantity ?? 1}</td>
                  <td className="px-4 py-3 text-sm">{displayFulfilled != null ? displayFulfilled : '—'}</td>
                  <td className="px-4 py-3 text-jays-red font-bold">{formatCAD(displayTotal)}</td>
                  <td className="px-4 py-3">{r.customerNameSnapshot}</td>
                  <td className="px-4 py-3 text-jays-steel text-xs">{r.customerPhoneSnapshot}</td>
                  <td className="px-4 py-3 text-jays-steel text-xs">{new Date(r.placedAt).toLocaleDateString('en-CA')}</td>
                  <td className="px-4 py-3 text-jays-steel text-xs">{new Date(r.resolvedAt).toLocaleDateString('en-CA')}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.finalStatus} /></td>
                  <td className="px-4 py-3 text-jays-steel text-xs">{r.resolvedBy?.email ?? 'system'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrapper>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            &larr; Previous
          </button>
          <span className="text-jays-steel">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
