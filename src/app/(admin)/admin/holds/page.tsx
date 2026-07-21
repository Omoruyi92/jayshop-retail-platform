'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatCAD } from '@/lib/utils'
import { toast } from 'sonner'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface Hold {
  id: string
  reservationCode: string
  status: string
  placedAt: string
  size: string | null
  holdQuantity: number
  totalPriceCents: number
  isStadiumHold: boolean
  pickupQueueAt: string | null
  queuePosition: number | null
  product: { name: string; priceCents: number }
  customer: { fullName: string; phone: string }
}

const STATUS_OPTIONS = ['', 'ACTIVE', 'PICKED_UP', 'RELEASED', 'EXPIRED']

interface PickupModalProps {
  hold: Hold
  onClose: () => void
  onConfirm: (fulfilledQty: number) => void
  submitting: boolean
}

function PickupModal({ hold, onClose, onConfirm, submitting }: PickupModalProps) {
  const unitPrice = hold.product.priceCents
  const maxQty = hold.holdQuantity
  const [fulfilledQty, setFulfilledQty] = useState(maxQty)
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(true, modalRef, onClose)

  const recalcTotal = unitPrice * fulfilledQty
  const isPartial = fulfilledQty < maxQty && fulfilledQty > 0
  const isRelease = fulfilledQty === 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-[env(safe-area-inset-bottom)]" onClick={onClose}>
      <div ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1} className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-6 pb-8 max-h-[90vh] overflow-y-auto focus:outline-none" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold uppercase text-jays-navy mb-1">Confirm Pick Up</h2>
        <p className="text-sm text-jays-steel mb-4">
          {hold.customer.fullName} · <span className="font-mono text-xs">{hold.reservationCode}</span>
        </p>

        <div className="bg-jays-ice rounded-xl p-3 mb-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-jays-steel">Product</span>
            <span className="font-medium text-jays-navy text-right">{hold.product.name}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-jays-steel">Hold qty</span>
            <span className="font-bold text-jays-navy">{maxQty}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-jays-steel">Unit price</span>
            <span className="font-medium text-jays-navy">{formatCAD(unitPrice)}</span>
          </div>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fulfilled quantity <span className="text-jays-steel font-normal">(0 = release)</span>
        </label>
        <input
          type="number"
          min={0}
          max={maxQty}
          value={fulfilledQty}
          onChange={(e) => {
            const v = Math.min(maxQty, Math.max(0, parseInt(e.target.value) || 0))
            setFulfilledQty(v)
          }}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy mb-4"
        />

        <div className="flex justify-between items-center mb-5 px-1">
          <span className="text-sm text-jays-steel">
            {isRelease ? 'Release hold (no sale)' : isPartial ? `Partial pickup · ${remainingLabel(maxQty, fulfilledQty)}` : 'Full pickup'}
          </span>
          <span className="font-bold text-jays-red text-base">
            {isRelease ? '—' : formatCAD(recalcTotal)}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-gray-200 text-gray-700 px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(fulfilledQty)}
            disabled={submitting}
            className={`flex-1 text-white px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              isRelease
                ? 'bg-gray-500 hover:bg-gray-600'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {submitting ? '…' : isRelease ? 'Release' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

function remainingLabel(holdQty: number, fulfilledQty: number) {
  const rem = holdQty - fulfilledQty
  return `${rem} remaining → new hold`
}

type TabKey = 'all' | 'stadium'

function AdminHoldsInner() {
  const searchParams = useSearchParams()
  const codeParam = searchParams.get('code') ?? ''
  const autoOpen = searchParams.get('autoOpen') === 'true'

  const [holds, setHolds] = useState<Hold[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [phone, setPhone] = useState('')
  const [codeFilter, setCodeFilter] = useState(codeParam)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const [pickupModal, setPickupModal] = useState<Hold | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expiringOverdue, setExpiringOverdue] = useState(false)

  const isStadiumTab = activeTab === 'stadium'

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (isStadiumTab) {
      p.set('stadiumQueue', 'true')
    } else {
      if (status) p.set('status', status)
      if (phone)  p.set('phone', phone)
      if (codeFilter) p.set('code', codeFilter)
      if (dateFrom) p.set('dateFrom', dateFrom)
      if (dateTo)   p.set('dateTo', dateTo)
    }
    p.set('limit', '100')
    fetch(`/api/admin/holds?${p}`)
      .then((r) => r.json())
      .then((d) => { setHolds(d.holds ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isStadiumTab, status, phone, codeFilter, dateFrom, dateTo])

  // Initial load + code param pre-filter
  useEffect(() => { load() }, [load])

  // 30-second polling
  useEffect(() => {
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  // Re-fetch on tab focus
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  // Auto-open PickupModal when ?autoOpen=true and single matching hold
  useEffect(() => {
    if (autoOpen && codeParam && !loading && holds.length === 1 && holds[0].status === 'ACTIVE') {
      setPickupModal(holds[0])
    }
  }, [autoOpen, codeParam, loading, holds])

  async function handlePickupConfirm(fulfilledQty: number) {
    if (!pickupModal) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/holds/${pickupModal.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfilledQty }),
      })
      if (res.ok) {
        const maxQty = pickupModal.holdQuantity
        if (fulfilledQty === 0) {
          toast.success('Hold released')
        } else if (fulfilledQty < maxQty) {
          toast.success(`Picked up ${fulfilledQty}/${maxQty} · new hold created for remaining ${maxQty - fulfilledQty}`)
        } else {
          toast.success('Marked picked up')
        }
        setPickupModal(null)
        load()
      } else {
        const d = await res.json()
        toast.error(d.error ?? 'Failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRelease(holdId: string) {
    const res = await fetch(`/api/admin/holds/${holdId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fulfilledQty: 0 }),
    })
    if (res.ok) {
      toast.success('Hold released')
      load()
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Failed')
    }
  }

  async function handleExpireOverdue() {
    setExpiringOverdue(true)
    try {
      const res = await fetch('/api/admin/expire-holds-manual', { method: 'POST' })
      const d = await res.json()
      if (res.ok) {
        if (d.processed === 0) {
          toast.success('No overdue holds to expire')
        } else {
          toast.success(`Expired ${d.processed} overdue hold${d.processed > 1 ? 's' : ''}`)
        }
        load()
      } else {
        toast.error(d.error ?? 'Failed to expire holds')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setExpiringOverdue(false)
    }
  }

  function handlePrint(hold: Hold, format: 'label' | 'receipt') {
    window.open(`/admin/holds/${hold.id}/print?format=${format}`, '_blank')
  }

  return (
    <div>
      {pickupModal && (
        <PickupModal
          hold={pickupModal}
          onClose={() => setPickupModal(null)}
          onConfirm={handlePickupConfirm}
          submitting={submitting}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">All Holds</h1>
        {!isStadiumTab && (
          <button
            onClick={handleExpireOverdue}
            disabled={expiringOverdue}
            className="text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {expiringOverdue ? 'Running…' : 'Expire Overdue'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-jays-navy text-white'
              : 'bg-white border border-gray-200 text-jays-steel hover:border-jays-navy'
          }`}
        >
          All Holds
        </button>
        <button
          onClick={() => setActiveTab('stadium')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'stadium'
              ? 'bg-amber-500 text-amber-950'
              : 'bg-white border border-gray-200 text-jays-steel hover:border-amber-400'
          }`}
        >
          <span>⚾</span>
          Stadium Queue
        </button>
      </div>

      {/* Filters — hidden for stadium queue tab */}
      {!isStadiumTab && (
        <div className="bg-white rounded-2xl border border-border p-3 mb-6 overflow-x-auto">
          <div className="flex flex-wrap gap-2 min-w-max sm:min-w-0">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jays-navy"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s || 'All Statuses'}</option>
              ))}
            </select>
            <input
              placeholder="Phone search"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jays-navy w-36"
            />
            <input
              placeholder="Reservation code"
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jays-navy w-36 font-mono"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jays-navy"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jays-navy"
            />
            <button
              onClick={load}
              className="bg-jays-navy text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-jays-royal transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Stadium Queue banner */}
      {isStadiumTab && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 text-amber-800 text-sm font-medium flex items-center gap-2">
          <span>⚾</span>
          <span>Active stadium holds — sorted by pickup queue time (earliest first)</span>
        </div>
      )}

      {/* Table */}
      <TableWrapper>
        <table className="w-full text-xs">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              {isStadiumTab && (
                <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Queue</th>
              )}
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Code</th>
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Product</th>
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase hidden sm:table-cell">Qty</th>
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase hidden sm:table-cell">Size</th>
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Customer</th>
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Total</th>
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Status</th>
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase hidden sm:table-cell">
                {isStadiumTab ? 'Created At' : 'Placed'}
              </th>
              {isStadiumTab && (
                <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Pickup ETA</th>
              )}
              {!isStadiumTab && (
                <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase hidden sm:table-cell">Type</th>
              )}
              <th className="px-4 py-2.5 font-medium text-jays-steel text-[10px] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: isStadiumTab ? 10 : 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-2">
                      <div className="h-3 bg-gray-100 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : holds.length === 0 ? (
              <tr>
                <td colSpan={isStadiumTab ? 10 : 10}>
                  <EmptyState title={isStadiumTab ? 'No stadium holds in queue' : 'No holds found'} />
                </td>
              </tr>
            ) : (
              holds.map((h, idx) => {
                const qty = h.holdQuantity ?? 1
                const total = h.totalPriceCents > 0 ? h.totalPriceCents : h.product.priceCents * qty
                const pickupEta = h.pickupQueueAt
                  ? new Date(h.pickupQueueAt).toLocaleTimeString('en-CA', {
                      timeZone: 'America/Toronto',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'
                return (
                  <tr key={h.id} className={`hover:bg-jays-ice/50 transition-colors even:bg-gray-50/50 ${h.isStadiumHold && !isStadiumTab ? 'border-l-2 border-amber-400' : ''}`}>
                    {isStadiumTab && (
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-amber-950 text-[10px] font-bold">
                          {h.queuePosition ?? idx + 1}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-2 font-mono text-[11px]">
                      {h.reservationCode}
                      {h.isStadiumHold && !isStadiumTab && (
                        <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 rounded">⚾</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-jays-navy">{h.product.name}</td>
                    <td className="px-4 py-2 font-bold text-jays-navy hidden sm:table-cell">{qty}</td>
                    <td className="px-4 py-2 text-jays-steel hidden sm:table-cell">{h.size ? <span className="font-medium text-jays-navy bg-jays-ice px-1.5 py-0.5 rounded">{h.size}</span> : '—'}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-jays-navy">{h.customer.fullName}</span>
                        <span className="text-[10px] text-jays-steel">{h.customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-jays-red font-bold text-sm">{formatCAD(total)}</td>
                    <td className="px-4 py-2"><StatusBadge status={h.status} /></td>
                    <td className="px-4 py-2 text-jays-steel text-[10px] hidden sm:table-cell">
                      {new Date(h.placedAt).toLocaleDateString('en-CA')}
                    </td>
                    {isStadiumTab && (
                      <td className="px-4 py-2 text-amber-700 font-medium text-[10px]">{pickupEta}</td>
                    )}
                    {!isStadiumTab && (
                      <td className="px-4 py-2 hidden sm:table-cell">
                        {h.isStadiumHold ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            <span>⚾</span> Stadium
                          </span>
                        ) : (
                          <span className="text-jays-steel text-[10px]">Standard</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <div className="flex gap-1 items-center">
                        {h.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => setPickupModal(h)}
                              className="px-2 py-1 min-h-[28px] bg-green-600 text-white text-[10px] rounded-md hover:bg-green-700 font-medium transition-colors"
                            >
                              Pick Up
                            </button>
                            <button
                              onClick={() => handleRelease(h.id)}
                              className="px-2 py-1 min-h-[28px] bg-gray-100 text-gray-600 text-[10px] rounded-md hover:bg-gray-200 font-medium transition-colors"
                            >
                              Release
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handlePrint(h, 'label')}
                          title="Print Tag"
                          className="px-2 py-1 min-h-[28px] bg-jays-ice text-jays-navy text-[10px] rounded-md hover:bg-blue-100 transition-colors leading-none"
                        >
                          🏷
                        </button>
                        <button
                          onClick={() => handlePrint(h, 'receipt')}
                          title="Print Receipt"
                          className="px-2 py-1 min-h-[28px] bg-jays-ice text-jays-navy text-[10px] rounded-md hover:bg-blue-100 transition-colors leading-none"
                        >
                          🖨
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}

export default function AdminHoldsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-jays-steel text-sm">Loading…</div>}>
      <AdminHoldsInner />
    </Suspense>
  )
}
