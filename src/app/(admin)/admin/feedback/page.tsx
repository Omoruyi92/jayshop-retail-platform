'use client'

import { useState, useEffect } from 'react'
import {
  Trash2,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
} from 'lucide-react'

type FeedbackStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface FeedbackItem {
  id: string
  name: string | null
  message: string
  status: FeedbackStatus
  moderatedBy: string | null
  moderatedAt: string | null
  createdAt: string
}

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [counts, setCounts] = useState({
    total: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'ALL'>('ALL')
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  async function fetchData() {
    setLoading(true)
    try {
      const url = statusFilter !== 'ALL' ? `/api/admin/feedback?status=${statusFilter}` : '/api/admin/feedback'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setItems(data.feedback ?? [])
        setCounts({
          total: data.total ?? 0,
          pendingCount: data.pendingCount ?? 0,
          approvedCount: data.approvedCount ?? 0,
          rejectedCount: data.rejectedCount ?? 0,
        })
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id: string, status: FeedbackStatus) {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const { feedback } = await res.json()
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: feedback.status,
                  moderatedBy: feedback.moderatedBy,
                  moderatedAt: feedback.moderatedAt,
                }
              : item
          )
        )
      }
    } catch { /* ignore */ }
    setActionLoading((prev) => ({ ...prev, [id]: false }))
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this feedback?')) return
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
      }
    } catch { /* ignore */ }
    setActionLoading((prev) => ({ ...prev, [id]: false }))
  }

  const statCards = [
    { label: 'Total', value: counts.total, icon: MessageSquare, color: 'text-jays-navy' },
    { label: 'Pending', value: counts.pendingCount, icon: AlertCircle, color: 'text-amber-600' },
    { label: 'Approved', value: counts.approvedCount, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Rejected', value: counts.rejectedCount, icon: XCircle, color: 'text-red-600' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-jays-navy uppercase tracking-wide">
            Site Feedback
          </h1>
          <p className="text-sm text-jays-steel mt-0.5">Feedback submitted by visitors via the floating feedback button. Approve fan favourites to show them on the homepage.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 text-sm text-jays-navy hover:text-jays-red transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider mb-2 ${color}`}>
              <Icon size={14} />
              {label}
            </div>
            <p className="text-2xl font-bold text-jays-navy">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Filter size={14} className="text-jays-steel" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | 'ALL')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-jays-navy focus:outline-none focus:ring-2 focus:ring-jays-red/20"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <MessageSquare className="mx-auto text-jays-steel/40 mb-2" size={32} />
          <p className="text-sm text-jays-steel/70">No feedback matches the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-jays-navy text-sm">{item.name?.trim() || 'Anonymous'}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[item.status]}`}>
                    {item.status}
                  </span>
                  <span className="text-[10px] text-jays-steel shrink-0">
                    {new Date(item.createdAt).toLocaleString('en-CA')}
                  </span>
                </div>

                {item.moderatedBy && (
                  <p className="text-[10px] text-jays-steel/70 mt-0.5">
                    Moderated by {item.moderatedBy} on{' '}
                    {new Date(item.moderatedAt ?? item.createdAt).toLocaleString('en-CA')}
                  </p>
                )}

                <p className="text-sm text-jays-steel mt-1.5 leading-relaxed whitespace-pre-wrap break-words">{item.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.status !== 'APPROVED' && (
                  <button
                    onClick={() => updateStatus(item.id, 'APPROVED')}
                    disabled={actionLoading[item.id]}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={12} />
                    Approve
                  </button>
                )}
                {item.status !== 'REJECTED' && (
                  <button
                    onClick={() => updateStatus(item.id, 'REJECTED')}
                    disabled={actionLoading[item.id]}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={12} />
                    Reject
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={actionLoading[item.id]}
                  aria-label="Delete feedback"
                  className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-jays-steel hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
