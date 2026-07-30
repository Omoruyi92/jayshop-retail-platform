'use client'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

export type ClearScope = 'filtered' | 'all'

interface ClearHistoryModalProps {
  /** Dialog heading, e.g. "Clear Hold History" */
  title: string
  /** Plural noun phrase describing what gets deleted, e.g. "Hold History records" */
  itemLabel: string
  /** API path used for both the GET (live count) and POST (execute) requests. */
  endpoint: string
  /** Filter query params to send with the GET count request / POST body when scope is "filtered". */
  filteredParams?: Record<string, string>
  /** Whether the page currently has active filters worth offering as a scoped clear. */
  hasFilters: boolean
  /** Human-readable summary of the active filters, shown next to the "filtered" option. */
  filterSummary?: string
  onClose: () => void
  onCleared: (deletedCount: number) => void
}

/**
 * Shared destructive-confirmation modal for the admin history "clear" actions.
 * Reuses the same fixed-backdrop / focus-trap shell as the Holds page's
 * PickupModal. Always shows a live count fetched from `endpoint` before the
 * clear can be confirmed, and requires typing DELETE when the scope is "all".
 */
export function ClearHistoryModal({
  title,
  itemLabel,
  endpoint,
  filteredParams,
  hasFilters,
  filterSummary,
  onClose,
  onCleared,
}: ClearHistoryModalProps) {
  const [scope, setScope] = useState<ClearScope>(hasFilters ? 'filtered' : 'all')
  const [count, setCount] = useState<number | null>(null)
  const [countLoading, setCountLoading] = useState(true)
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(true, modalRef, onClose)

  useEffect(() => {
    setCountLoading(true)
    setError(null)
    const q = new URLSearchParams(scope === 'filtered' ? filteredParams : undefined)
    fetch(`${endpoint}?${q}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`)
        return r.json()
      })
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setError('Unable to load record count.'))
      .finally(() => setCountLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope])

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          ...(scope === 'filtered' ? { filters: filteredParams ?? {} } : { confirmText }),
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(d.error ?? 'Failed to clear records.')
        return
      }
      onCleared(d.deleted ?? 0)
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const requiresTyping = scope === 'all'
  const confirmDisabled =
    submitting ||
    countLoading ||
    (count ?? 0) === 0 ||
    (requiresTyping && confirmText !== 'DELETE')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-[env(safe-area-inset-bottom)]"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 pb-8 max-h-[90vh] overflow-y-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={18} className="text-jays-red" />
          <h2 className="font-display text-lg font-bold uppercase text-jays-navy">{title}</h2>
        </div>
        <p className="text-sm text-jays-steel mb-4">
          This permanently deletes records. This action cannot be undone.
        </p>

        {hasFilters && (
          <div className="space-y-2 mb-4">
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="clear-scope"
                checked={scope === 'filtered'}
                onChange={() => { setScope('filtered'); setConfirmText('') }}
                className="mt-0.5 accent-jays-navy"
              />
              <span>
                Clear filtered results only
                {filterSummary && <span className="block text-xs text-jays-steel">{filterSummary}</span>}
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="clear-scope"
                checked={scope === 'all'}
                onChange={() => { setScope('all'); setConfirmText('') }}
                className="mt-0.5 accent-jays-red"
              />
              <span>Clear ALL {itemLabel}</span>
            </label>
          </div>
        )}

        <div className="bg-jays-ice rounded-xl p-3 mb-4 text-sm flex items-center justify-between">
          <span className="text-jays-steel">Records to delete</span>
          <span className="font-bold text-jays-red text-base">
            {countLoading ? '…' : (count ?? 0).toLocaleString('en-CA')}
          </span>
        </div>

        {requiresTyping && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-mono font-bold text-jays-red">DELETE</span> to confirm clearing ALL {itemLabel}
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-red"
              autoComplete="off"
            />
          </div>
        )}

        {error && <p className="text-sm text-jays-red mb-4">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-gray-200 text-gray-700 px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className="flex-1 bg-jays-red text-white px-4 py-3 min-h-[44px] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Clearing…' : 'Clear History'}
          </button>
        </div>
      </div>
    </div>
  )
}
