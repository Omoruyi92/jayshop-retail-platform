'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { findMlbTeam, mlbTeamLogoUrl } from '@/lib/mlbTeams'

interface GameDay {
  id: string
  date: string
  startTime: string | null
  opponent: string | null
  note: string | null
}

// The admin-entered date is stored as a UTC midnight calendar date (no
// time-of-day component). Formatting it MUST use timeZone: 'UTC' — otherwise
// browsers in timezones west of UTC (e.g. America/Toronto) shift the
// displayed date back by one day. This keeps the admin dashboard and the
// landing page showing the exact same calendar date entered by the admin.
function formatGameDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Formats a stored 24-hour "HH:mm" start time (e.g. "19:07") as "7:07 PM". */
function formatStartTime(startTime: string | null): string | null {
  if (!startTime) return null
  const [h, m] = startTime.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export default function UpcomingMatchCard() {
  const [gameDay, setGameDay] = useState<GameDay | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/game-days/next')
      .then((res) => (res.ok ? res.json() : { gameDay: null }))
      .then((data) => {
        if (!cancelled) setGameDay(data.gameDay ?? null)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Nothing to show when the fetch hasn't resolved yet, or no upcoming home
  // game is scheduled — this card is purely informational, so it should
  // disappear entirely rather than render an empty state.
  if (!loaded || !gameDay) return null

  const opponentTeam = findMlbTeam(gameDay.opponent)

  return (
    <div className="mx-auto max-w-md sm:max-w-lg mb-4">
      <div className="relative rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-lg">
        <p className="text-center text-[9px] sm:text-[10px] font-display uppercase tracking-[0.2em] text-blue-200/70 mb-1.5">
          Upcoming Home Game
        </p>

        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {/* Blue Jays */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-sm">
                  <Image src="/brand/logo.png" alt="Toronto Blue Jays" width={40} height={40} className="w-full h-full object-contain p-1" />
                </div>
                <span className="text-xs sm:text-sm font-display font-bold text-white uppercase tracking-wide leading-tight">
                  Blue Jays
                </span>
              </div>

              <span className="text-amber-300 font-display font-bold text-xs sm:text-sm">VS</span>

              {/* Opponent */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-display font-bold text-white uppercase tracking-wide leading-tight">
                  {opponentTeam ? opponentTeam.name : gameDay.opponent ?? 'TBD'}
                </span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-sm">
                  {opponentTeam ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mlbTeamLogoUrl(opponentTeam.id)}
                      alt={opponentTeam.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-jays-navy font-display font-bold text-xs">
                      {gameDay.opponent ? gameDay.opponent.slice(0, 3).toUpperCase() : '?'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-blue-100/80 text-[10px] sm:text-xs mt-1.5 leading-snug">
              {formatGameDate(gameDay.date)} · Rogers Centre
              {gameDay.note ? ` · ${gameDay.note}` : ''}
              {formatStartTime(gameDay.startTime) && (
                <>
                  {' '}
                  ·{' '}
                  <span className="text-amber-300 font-display font-semibold">
                    First Pitch: {formatStartTime(gameDay.startTime)}
                  </span>
                </>
              )}
            </p>
      </div>
    </div>
  )
}
