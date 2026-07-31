// PartnerLogosBar.tsx — inline store status badge for the header
'use client'

import { useState, useEffect } from 'react'
import { getStoreStatus, type StoreStatusResult } from '@/lib/store/getStoreStatus'

/* Fetches today's scheduled game (if any) from the existing public
 * `/api/game-days/next` endpoint — the same source of truth already used by
 * the homepage's "game day" banner (HomePageClient.tsx). GameDay.date is a
 * UTC calendar date, so "is this game today" is determined via UTC Y/M/D
 * comparison, matching the pattern used elsewhere in the codebase. Resolves
 * to `null` on any failure or when there is no game scheduled for today. */
async function fetchTodayGame(): Promise<{ startTime: string | null; date: string } | null> {
  try {
    const res = await fetch('/api/game-days/next')
    if (!res.ok) return null
    const data = await res.json()
    const gameDay = data?.gameDay
    if (!gameDay?.date) return null

    const now = new Date()
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const gameDate = new Date(gameDay.date)
    const gameDateUTC = Date.UTC(gameDate.getUTCFullYear(), gameDate.getUTCMonth(), gameDate.getUTCDate())

    if (gameDateUTC !== today) return null
    // `date` is forwarded so getStoreStatus derives the weekday/weekend
    // closure offset from the GAME DATE itself (America/Toronto calendar
    // date), not from the visitor's or server's notion of "now".
    return { startTime: gameDay.startTime ?? null, date: gameDay.date }
  } catch {
    return null
  }
}

/* On first paint (SSR + initial client render, before hydration), we
 * deliberately do NOT compute a time-derived value — that value can differ
 * between the server's render instant and the client's hydration instant
 * (widened further by ISR staleness), which is exactly what causes React
 * hydration mismatches. Instead we render a stable, neutral "pending" state
 * on both sides, then compute the real, timezone-aware status inside a
 * useEffect after mount — the standard React-recommended pattern for any
 * value that legitimately differs between server and client render time. */
function useStoreStatus() {
  const [status, setStatus] = useState<StoreStatusResult | null>(null)

  useEffect(() => {
    let cancelled = false

    const update = async () => {
      const todayGame = await fetchTodayGame()
      if (cancelled) return
      setStatus(getStoreStatus(new Date(), todayGame))
    }

    update()
    const id = setInterval(update, 60_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return status
}

/* Shared location badge used on both desktop (inline) and mobile (strip below header) */
export function LocationBadge({ compact = false }: { compact?: boolean }) {
  const status = useStoreStatus()
  // On first paint (SSR + initial client render) status is null on both
  // server and client — identical output, so no hydration mismatch is
  // possible. The dot/label/nextChange placeholders below are sized and
  // styled the same as the real content to avoid any layout shift (CLS)
  // when the real value swaps in post-mount. While pending, the placeholders
  // use the WIDEST realistic strings ("Closed" / "Opens at 10:00 AM") rendered
  // transparent — this reserves the pill's final footprint on the very first
  // paint (the old \u00A0 placeholder was ~2px wide, so the pill visibly grew
  // and re-centered when the real status arrived — a measurable CLS source).
  const isOpen = status?.isOpen ?? false
  const statusLabel = status?.statusLabel ?? 'Closed'
  const nextChange = status?.nextChange ?? 'Opens at 10:00 AM'
  const isPending = status === null
  // Game-day-only state: store is open to ticketed fans inside the stadium,
  // but locked out for the general public — distinct amber treatment so it
  // reads differently from a plain overnight "Closed".
  const isRestrictedPublic = status?.statusLabel === 'Closed to the General Public'

  const dotClass = isPending
    ? 'bg-white/20'
    : isOpen
      ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]'
      : isRestrictedPublic
        ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.6)]'
        : 'bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.5)]'

  const labelClass = isPending
    ? 'text-transparent'
    : isOpen
      ? 'text-emerald-300'
      : isRestrictedPublic
        ? 'text-amber-300'
        : 'text-red-300'

  return (
    <div className="flex items-center gap-2 shrink-0">
      <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-300/80 shrink-0`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
      </svg>
      <div className="leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-bold uppercase tracking-wide text-white ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
            Jays Shop
          </span>
          <span className="text-blue-300/40 text-[9px]">·</span>
          <span className="text-blue-200/60 text-[9px]">Toronto</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className={`text-[9px] font-semibold ${labelClass}`}>
            {statusLabel}
          </span>
          <span className="text-blue-300/30 text-[8px]">·</span>
          <span className={`text-[8px] ${isPending ? 'text-transparent' : 'text-blue-200/50'}`}>{nextChange}</span>
        </div>
      </div>
    </div>
  )
}

export default function PartnerLogosBar() {
  return (
    <div className="flex items-center bg-white/[0.06] rounded-full px-3 py-1 border border-white/10 gap-2">
      <LocationBadge />
    </div>
  )
}
