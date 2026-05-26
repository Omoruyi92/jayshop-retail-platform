'use client'
import { useEffect, useRef, useState } from 'react'
import { formatCAD } from '@/lib/utils'
import { toast } from 'sonner'

interface HoldRow {
  id: string
  reservationCode: string
  status: string
  placedAt: string
  expiresAt: string
  holdQuantity: number
  totalPriceCents: number
  product: { name: string; priceCents: number; imageUrl: string }
  customer: { fullName: string; phone: string }
}

export default function AdminDashboardPage() {
  const [holds, setHolds] = useState<HoldRow[]>([])
  const [loading, setLoading] = useState(true)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true

    // Initial load
    const fetchHolds = () =>
      fetch('/api/admin/holds?status=ACTIVE&limit=50')
        .then((r) => r.json())
        .then((d) => { if (mounted) { setHolds(d.holds ?? []); setLoading(false) } })
        .catch(() => { if (mounted) setLoading(false) })

    fetchHolds()

    // If Supabase is configured, use Realtime; otherwise poll every 5s
    import('@/lib/supabase').then(({ supabase, hasSupabase }) => {
      if (!mounted) return
      if (hasSupabase) {
        const channel = supabase
          .channel('admin-holds-feed')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Hold' },
            fetchHolds
          )
          .subscribe()
        cleanupRef.current = () => channel.unsubscribe()
      } else {
        const interval = setInterval(fetchHolds, 5000)
        cleanupRef.current = () => clearInterval(interval)
      }
    })

    return () => {
      mounted = false
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  async function handleAction(holdId: string, action: 'pickup' | 'release') {
    const fulfilledQty = action === 'pickup'
      ? (holds.find((h) => h.id === holdId)?.holdQuantity ?? 1)
      : 0
    const res = await fetch(`/api/admin/holds/${holdId}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fulfilledQty }),
    })
    if (res.ok) {
      toast.success(action === 'pickup' ? 'Marked as picked up' : 'Hold released')
      setHolds((prev) => prev.filter((h) => h.id !== holdId))
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Action failed')
    }
  }

  const activeCount = holds.length

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Dashboard</h1>
        <p className="text-jays-steel text-sm mt-1">Live hold activity feed</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-jays-steel text-xs uppercase tracking-wide font-medium mb-1">Active Holds</p>
          <p className="font-display text-3xl font-bold text-jays-navy">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-jays-steel text-xs uppercase tracking-wide font-medium mb-1">Status</p>
          <p className="font-display text-lg font-bold text-green-600">
            {loading ? 'Loading…' : 'Live'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-jays-steel text-xs uppercase tracking-wide font-medium mb-1">Store Hours</p>
          <p className="text-sm text-jays-navy font-semibold">Sun–Sat 10am – 5pm</p>
        </div>
      </div>

      {/* Holds table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm">
            Active Holds
          </h2>
          <span className="text-xs bg-jays-navy text-white px-2 py-0.5 rounded-full font-medium">
            {activeCount} active
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-jays-steel text-sm">Loading holds…</div>
        ) : holds.length === 0 ? (
          <div className="p-10 text-center text-jays-steel">
            <p className="text-sm">No active holds right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {holds.map((hold) => {
              const expiresAt = new Date(hold.expiresAt)
              const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 3_600_000))
              return (
                <div key={hold.id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Product image */}
                    <div
                      className="w-12 h-12 rounded-lg bg-jays-ice shrink-0 overflow-hidden"
                      style={{ backgroundImage: `url(${hold.product.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                    />

                    {/* Info */}
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-jays-navy uppercase text-sm truncate">
                        {hold.product.name}
                      </p>
                      <p className="text-xs text-jays-steel truncate">
                        {hold.customer.fullName} · {hold.customer.phone}
                      </p>
                      <p className="text-xs text-jays-steel mt-0.5">
                        Code: <span className="font-mono">{hold.reservationCode}</span>
                        &nbsp;·&nbsp;
                        <span className={hoursLeft <= 4 ? 'text-jays-red font-medium' : ''}>
                          {hoursLeft}h left
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Price + Actions row on mobile, inline on desktop */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <p className="text-jays-red font-bold text-sm">
                      {formatCAD(hold.totalPriceCents)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(hold.id, 'pickup')}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Picked Up
                      </button>
                      <button
                        onClick={() => handleAction(hold.id, 'release')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Release
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
