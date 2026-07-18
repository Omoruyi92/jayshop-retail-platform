'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Download, Search, FileText } from 'lucide-react'
import AdminBackButton from '@/components/admin/AdminBackButton'

type AuditRow = {
  id: string
  action: string
  entityType: string
  entityId: string
  actorType?: string | null
  actorEmail?: string | null
  before?: object | null
  after?: object | null
  payload?: object | null
  createdAt: string
  actor?: { email: string } | null
}

const formatJson = (v: unknown) => JSON.stringify(v, null, 2)

function downloadCSV(rows: AuditRow[]) {
  const columns = ['createdAt', 'action', 'entityType', 'entityId', 'actorEmail', 'actorType', 'payload']
  const csv = [columns.join(','), ...rows.map(r => columns.map(c => {
    const val = (r as any)[c]
    if (val == null) return ''
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    return `"${str.replace(/"/g, '""')}"`
  }).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [filters, setFilters] = useState({ action: '', entityType: '', actorEmail: '' })
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const initialRef = useRef(false)

  async function load(cursor?: string) {
    if (loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (cursor) params.set('cursor', cursor)
      if (filters.action) params.set('action', filters.action)
      if (filters.entityType) params.set('entityType', filters.entityType)
      if (filters.actorEmail) params.set('actorEmail', filters.actorEmail)
      const res = await fetch(`/api/admin/audit-log?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (cursor) {
        setRows(prev => [...prev, ...data.rows])
      } else {
        setRows(data.rows)
      }
      setNextCursor(data.nextCursor)
    } catch (e) {
      toast.error('Failed to load audit log')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialRef.current) return
    initialRef.current = true
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loadMoreRef.current) return
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextCursor && !loading) {
        load(nextCursor)
      }
    })
    observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor, loading])

  const applyFilters = useCallback(() => {
    setRows([])
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  return (
    <main className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <AdminBackButton />
          <h1 className="text-2xl font-bold flex items-center gap-2 mt-2">
            <FileText size={24} className="text-jays-red" />
            Audit Log
          </h1>
          <p className="text-gray-500 text-sm">Append-only record of administrative actions</p>
        </div>
        <button
          onClick={() => downloadCSV(rows)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <Download size={16} /> Export CSV ({rows.length})
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Action (e.g. admin.created)"
          value={filters.action}
          onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Entity (e.g. Hold)"
          value={filters.entityType}
          onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Actor email"
          value={filters.actorEmail}
          onChange={e => setFilters(f => ({ ...f, actorEmail: e.target.value }))}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={applyFilters} className="flex items-center gap-2 px-4 py-2 bg-jays-red text-white rounded-lg hover:opacity-90">
          <Search size={16} /> Apply
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-left sticky top-0">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium">{r.action}</td>
                  <td className="px-4 py-3">{r.entityType}<br/><span className="text-gray-400 text-xs font-mono">{r.entityId.slice(0, 8)}</span></td>
                  <td className="px-4 py-3">{r.actorEmail || r.actor?.email || r.actorType || '—'}</td>
                  <td className="px-4 py-3 max-w-md">
                    {r.before || r.after ? (
                      <details className="cursor-pointer text-xs text-gray-600 dark:text-gray-300">
                        <summary>Before / After</summary>
                        <pre className="mt-2 p-2 bg-gray-50 dark:bg-slate-800 rounded overflow-auto">b: {formatJson(r.before)}<br/>a: {formatJson(r.after)}</pre>
                      </details>
                    ) : null}
                    {r.payload && Object.keys(r.payload).length > 0 ? (
                      <details className="cursor-pointer text-xs text-gray-600 dark:text-gray-300">
                        <summary>Payload</summary>
                        <pre className="mt-2 p-2 bg-gray-50 dark:bg-slate-800 rounded overflow-auto">{formatJson(r.payload)}</pre>
                      </details>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div ref={loadMoreRef} className="p-4 text-center text-sm text-gray-500">
          {loading ? 'Loading...' : nextCursor ? 'Scroll to load more' : rows.length === 0 ? 'No audit rows' : 'End of log'}
        </div>
      </div>
    </main>
  )
}
