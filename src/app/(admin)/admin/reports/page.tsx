'use client'
import { useState, useEffect, useCallback } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TableWrapper } from '@/components/ui/TableWrapper'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCAD } from '@/lib/utils'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { ClearHistoryModal } from '@/components/admin/ClearHistoryModal'
import { useCurrentAdmin } from '@/hooks/useCurrentAdmin'

interface ReportData {
  period: string
  totalHolds: number
  pickedUp: number
  expired: number
  conversionRate: number
  noShowRate: number
  totalRevenueCents: number
  topHeld: { name: string; count: number }[]
  topSold: { name: string; units: number; revenueCents: number }[]
  weeklyRevenue: { week: string; revenueCents: number }[]
  noShowCustomers: { phone: string; total: number; expired: number; noShowRate: number }[]
}

const PERIODS = [
  { label: '7 Days',  value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
]

export default function AdminReportsPage() {
  const { can } = useCurrentAdmin()
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showClearModal, setShowClearModal] = useState(false)

  const loadReports = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/reports?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  useEffect(() => { loadReports() }, [loadReports])

  function handleExport() {
    window.location.href = `/api/admin/reports/export?period=${period}`
  }

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? period

  return (
    <div>
      <AdminBackButton />
      {showClearModal && (
        <ClearHistoryModal
          title="Clear Sales History"
          itemLabel="sales history records"
          endpoint="/api/admin/reports/sales-history/clear"
          filteredParams={{ period }}
          hasFilters
          filterSummary={`Period: ${periodLabel}`}
          onClose={() => setShowClearModal(false)}
          onCleared={(deleted) => {
            toast.success(`Cleared ${deleted} sales history record${deleted === 1 ? '' : 's'}`)
            loadReports()
          }}
        />
      )}
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Reports</h1>
          <p className="text-jays-steel text-sm mt-1">Metrics from hold + sales history</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-white border border-border rounded-xl overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-jays-navy text-white'
                    : 'text-jays-steel hover:bg-jays-ice'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-jays-navy text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
          {can('sales-history:delete') && (
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-2 border border-jays-red text-jays-red px-4 py-2 rounded-xl text-sm font-semibold hover:bg-jays-red/5 transition-colors"
            >
              <Trash2 size={16} />
              Clear Sales History
            </button>
          )}
        </div>
      </div>

      {loading || !data ? (
        <div className="text-jays-steel text-sm p-10 text-center">Loading reports…</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Holds',      value: data.totalHolds,             sub: 'in period' },
              { label: 'Picked Up',        value: data.pickedUp,               sub: `${data.conversionRate}% conversion` },
              { label: 'No-Shows (Exp.)',  value: data.expired,                sub: `${data.noShowRate}% no-show rate` },
              { label: 'Revenue (CAD)',    value: formatCAD(data.totalRevenueCents ?? 0), sub: 'sold this period' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                <p className="text-jays-steel text-xs uppercase tracking-wide font-medium mb-1">{kpi.label}</p>
                <p className="font-display text-2xl font-bold text-jays-navy">{kpi.value}</p>
                <p className="text-xs text-jays-steel mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-2xl border border-border p-5 mb-6">
            <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-4">
              Weekly Revenue (CAD)
            </h2>
            {data.weeklyRevenue.length === 0 ? (
              <p className="text-jays-steel text-sm text-center py-8">No sales data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.weeklyRevenue.map((w) => ({ ...w, revenue: w.revenueCents / 100 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip formatter={(v: number) => [`$${v.toFixed(2)} CAD`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#134A8E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Two-column: top held / top sold */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Top 10 held */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-4">Top 10 Items Held</h2>
              {data.topHeld.length === 0 ? (
                <p className="text-jays-steel text-sm">No data.</p>
              ) : (
                <div className="space-y-2">
                  {data.topHeld.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-jays-steel w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-jays-navy rounded-full"
                            style={{ width: `${Math.round((item.count / data.topHeld[0].count) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-jays-navy shrink-0">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 10 sold */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <h2 className="font-display font-semibold uppercase text-jays-navy text-sm mb-4">Top 10 Items Sold</h2>
              {data.topSold.length === 0 ? (
                <p className="text-jays-steel text-sm">No data.</p>
              ) : (
                <div className="space-y-2">
                  {data.topSold.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-jays-steel w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-jays-steel">{formatCAD(item.revenueCents)}</p>
                      </div>
                      <span className="text-xs font-bold text-jays-red shrink-0">{item.units} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Per-customer no-show table */}
          <TableWrapper>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">
                Per-Customer No-Show Stats
              </h2>
              <p className="text-xs text-jays-steel mt-0.5">Customers with 2+ expired holds, all-time.</p>
            </div>
            {data.noShowCustomers.length === 0 ? (
              <EmptyState title="No repeat no-shows detected" />
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-jays-ice/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Phone</th>
                    <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Total Holds</th>
                    <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">Expired</th>
                    <th className="px-4 py-3 font-medium text-jays-steel text-xs uppercase">No-Show Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.noShowCustomers.map((c) => (
                    <tr key={c.phone} className="hover:bg-jays-ice/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                      <td className="px-4 py-3">{c.total}</td>
                      <td className="px-4 py-3">{c.expired}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${c.noShowRate >= 50 ? 'text-jays-red' : 'text-jays-steel'}`}>
                          {c.noShowRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableWrapper>
        </>
      )}
    </div>
  )
}
