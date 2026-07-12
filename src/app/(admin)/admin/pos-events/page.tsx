'use client'
import { useState, useEffect, useCallback, Fragment } from 'react'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { TypeBadge } from '@/components/admin/InventoryHistoryTable'
import { cn } from '@/lib/utils'
import { useInventoryStream } from '@/hooks/useInventoryStream'

type PosEventRow = {
  id: string
  externalId: string
  type: string
  status: string
  errorReason: string | null
  createdAt: string
  payload: unknown
  location: { code: string; name: string } | null
  apiKey: { id: string; name: string } | null
  transactions: { id: string; productId: string; size: string; type: string; quantity: number; createdAt: string }[]
}

const STATUS_STYLES: Record<string, string> = {
  applied: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  deduped: 'bg-slate-100 text-slate-700',
}

export default function PosEventsPage() {
  const [events, setEvents] = useState<PosEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams()
    if (type) p.set('type', type)
    if (status) p.set('status', status)
    fetch(`/api/admin/pos-events?${p}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false))
  }, [type, status])

  useEffect(() => { load() }, [load])

  // Live refresh whenever a POS-driven inventory mutation lands (Phase 8 SSE).
  useInventoryStream({}, { onInventoryChanged: () => load() })

  return (
    <div>
      <AdminBackButton />
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">POS Events</h1>
          <p className="text-jays-steel text-sm mt-1">
            Append-only log of every /api/pos/transaction call, cross-linked to inventory transactions
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy">
            <option value="">All</option>
            <option value="sale">Sale</option>
            <option value="return">Return</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy">
            <option value="">All</option>
            <option value="applied">Applied</option>
            <option value="rejected">Rejected</option>
            <option value="deduped">Deduped</option>
          </select>
        </div>
      </div>

      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-jays-ice/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Timestamp</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">External ID</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Type</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Location</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Status</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">API Key</th>
              <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Txns</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-jays-steel">Loading…</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No POS events yet" /></td></tr>
            ) : events.map((ev) => (
              <Fragment key={ev.id}>
                <tr
                  className="hover:bg-jays-ice/50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                >
                  <td className="px-4 py-3 text-jays-steel text-xs whitespace-nowrap">
                    {new Date(ev.createdAt).toLocaleString('en-CA')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{ev.externalId}</td>
                  <td className="px-4 py-3"><TypeBadge type={ev.type} /></td>
                  <td className="px-4 py-3 text-xs text-jays-steel">
                    {ev.location ? `${ev.location.code} — ${ev.location.name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', STATUS_STYLES[ev.status] ?? 'bg-gray-100 text-gray-500')}>
                      {ev.status}
                    </span>
                    {ev.errorReason && <span className="ml-2 text-xs text-red-500">{ev.errorReason}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-jays-steel">{ev.apiKey?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-jays-steel">{ev.transactions.length}</td>
                </tr>
                {expanded === ev.id && (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 bg-jays-ice/30">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold uppercase text-jays-steel mb-2">Payload</h3>
                          <pre className="bg-white border border-border rounded-xl p-3 text-xs overflow-x-auto">
                            {JSON.stringify(ev.payload, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold uppercase text-jays-steel mb-2">
                            Linked Inventory Transactions
                          </h3>
                          {ev.transactions.length === 0 ? (
                            <p className="text-xs text-jays-steel">No transactions recorded (event was rejected or deduped)</p>
                          ) : (
                            <ul className="space-y-1">
                              {ev.transactions.map((t) => (
                                <li key={t.id} className="bg-white border border-border rounded-xl px-3 py-2 text-xs flex justify-between">
                                  <span>{t.size} · {t.type}</span>
                                  <span className={t.quantity > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </TableWrapper>
    </div>
  )
}
