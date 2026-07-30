'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import AdminBackButton from '@/components/admin/AdminBackButton'
import { CalendarDays, Trash2, AlertTriangle } from 'lucide-react'

interface GameDay {
  id: string
  date: string
  startTime: string | null
  opponent: string | null
  note: string | null
}

function todayIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10)
}

/** Formats a stored 24-hour "HH:mm" start time as "7:07 PM". */
function formatStartTime(startTime: string | null): string | null {
  if (!startTime) return null
  const [h, m] = startTime.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export default function GameDaysPage() {
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [opponent, setOpponent] = useState('')
  const [note, setNote] = useState('')

  async function load() {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch('/api/admin/game-days')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGameDays(data.gameDays ?? [])
    } catch {
      // A failed fetch must NOT render as "No game days scheduled" — rows may
      // exist (POST 409s would still fire) while the list silently looks empty.
      setLoadError(true)
      toast.error('Failed to load game days')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const isTodayGameDay = gameDays.some((g) => g.date.slice(0, 10) === todayIso())

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/game-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, opponent, note, startTime: startTime || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Game day added')
        setDate('')
        setStartTime('')
        setOpponent('')
        setNote('')
        load()
      } else {
        toast.error(data.error || 'Failed to add game day')
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/game-days/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Game day removed')
        setGameDays((prev) => prev.filter((g) => g.id !== id))
      } else {
        toast.error('Failed to remove game day')
      }
    } catch {
      toast.error('Network error — please try again')
    }
  }

  return (
    <div className="max-w-2xl">
      <AdminBackButton />
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Game Days</h1>
          <p className="text-jays-steel text-sm mt-1">
            On game days, extended (48-hour) holds are automatically disabled
          </p>
        </div>
      </div>

      {isTodayGameDay && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0" />
          <span className="font-semibold">Today is a game day — extended holds disabled.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays size={18} className="text-jays-navy" />
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm tracking-wide">
            Add Game Day
          </h2>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Pitch</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="Optional"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opponent</label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Optional"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jays-navy/40"
            />
          </div>
          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={submitting || !date}
              className="bg-jays-navy text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-jays-royal disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Adding…' : 'Add Game Day'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold uppercase text-jays-navy text-sm tracking-wide">
            Upcoming Game Days
          </h2>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-jays-steel">Loading…</p>
        ) : loadError ? (
          <div className="p-6 text-sm">
            <p className="text-red-600 font-medium">Couldn&apos;t load game days — the list below may be incomplete.</p>
            <button
              onClick={load}
              className="mt-2 inline-flex items-center rounded-xl border border-border px-4 py-2 text-xs font-semibold text-jays-navy hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        ) : gameDays.length === 0 ? (
          <p className="p-6 text-sm text-jays-steel">No game days scheduled.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-jays-steel border-b border-border">
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">First Pitch</th>
                <th className="px-6 py-3 font-semibold">Opponent</th>
                <th className="px-6 py-3 font-semibold">Note</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gameDays.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 font-medium text-jays-navy">
                    {new Date(g.date).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-3 text-jays-steel">{formatStartTime(g.startTime) || '—'}</td>
                  <td className="px-6 py-3 text-jays-steel">{g.opponent || '—'}</td>
                  <td className="px-6 py-3 text-jays-steel">{g.note || '—'}</td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-semibold"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
