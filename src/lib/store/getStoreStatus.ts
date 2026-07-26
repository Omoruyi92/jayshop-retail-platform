// getStoreStatus.ts — single source of truth for the nav bar's Open/Closed
// status pill. Pure functions only (no React/DOM), so this is easy to unit
// test and reused identically wherever the store status needs to be computed.

export const STORE_TIMEZONE = 'America/Toronto'

const OPEN_HOUR = 10 // 10:00 AM
const CLOSE_HOUR = 17 // 5:00 PM
const GATE_OPEN_OFFSET_MINUTES = 120 // gates open = first pitch − 2h

export type StoreStatusLabel = 'Open' | 'Closed' | 'Closed to the General Public'

export interface StoreStatusResult {
  isOpen: boolean
  statusLabel: StoreStatusLabel
  nextChange: string
}

/** Minimal shape needed from a GameDay row to compute today's status. */
export interface TodayGameInput {
  startTime: string | null | undefined
}

/**
 * Reads the current minutes-since-midnight (0-1439) in the store's timezone,
 * regardless of the runtime's ambient timezone (server runs in UTC on
 * Vercel, browsers run in the visitor's local timezone). Must be used
 * identically on both server and client so the two never disagree on the
 * same instant — this is the same pattern already used by
 * `PartnerLogosBar.tsx`'s `getStoreHour()`.
 */
function getStoreMinutes(date: Date, timeZone: string = STORE_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date)

  const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '0'
  const minutePart = parts.find((p) => p.type === 'minute')?.value ?? '0'

  // 'en-US' with hour12:false can format midnight as "24"; normalize to 0-23.
  const hour = parseInt(hourPart, 10) % 24
  const minute = parseInt(minutePart, 10)
  return hour * 60 + minute
}

/** Parses a "HH:mm" 24-hour string (as stored on GameDay.startTime) into
 * minutes-since-midnight. Returns null when missing or malformed. */
function parseStartTimeToMinutes(startTime: string | null | undefined): number | null {
  if (!startTime) return null
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(startTime)
  if (!match) return null
  const hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  return hour * 60 + minute
}

function formatMinutesAsClock(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hour24 = Math.floor(normalized / 60)
  const minute = normalized % 60
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const minuteStr = minute.toString().padStart(2, '0')
  return `${hour12}:${minuteStr} ${period}`
}

/**
 * Computes the nav bar store status for "now" given (optionally) today's
 * scheduled game.
 *
 * Rules:
 * - Before 10:00 AM: Closed, "Opens at 10:00 AM" (game day or not).
 * - Non-game day (or game day with no usable startTime): standard
 *   10:00 AM–5:00 PM Open window.
 * - Game day with a valid startTime: Open from 10:00 AM until
 *   min(gateOpenTime, 5:00 PM). At/after that cutoff, if the cutoff was
 *   actually driven by the gate-open time (i.e. gates open before the
 *   regular 5:00 PM close), status becomes "Closed to the General Public"
 *   instead of the regular "Closed". If gates open later than 5:00 PM
 *   (e.g. evening games), the regular 5:00 PM close wins and status is
 *   plain "Closed" afterward.
 */
export function getStoreStatus(now: Date, todayGame: TodayGameInput | null): StoreStatusResult {
  const nowMinutes = getStoreMinutes(now)
  const openMinutes = OPEN_HOUR * 60
  const closeMinutes = CLOSE_HOUR * 60

  if (nowMinutes < openMinutes) {
    return { isOpen: false, statusLabel: 'Closed', nextChange: 'Opens at 10:00 AM' }
  }

  const firstPitchMinutes = todayGame ? parseStartTimeToMinutes(todayGame.startTime) : null
  const gateOpenMinutes = firstPitchMinutes !== null ? firstPitchMinutes - GATE_OPEN_OFFSET_MINUTES : null

  // Effective close is whichever comes first: gate-open time (if it's
  // actually before the regular close) or the regular 5:00 PM close.
  // Clamp to openMinutes so an unusually early first pitch can't make the
  // computed cutoff fall before the store's own opening time.
  const gateClosesEarly = gateOpenMinutes !== null && gateOpenMinutes < closeMinutes
  const cutoffMinutes = Math.max(gateClosesEarly ? gateOpenMinutes! : closeMinutes, openMinutes)

  if (nowMinutes < cutoffMinutes) {
    return { isOpen: true, statusLabel: 'Open', nextChange: `Closes at ${formatMinutesAsClock(cutoffMinutes)}` }
  }

  if (gateClosesEarly) {
    return { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' }
  }

  return { isOpen: false, statusLabel: 'Closed', nextChange: 'Opens at 10:00 AM' }
}
