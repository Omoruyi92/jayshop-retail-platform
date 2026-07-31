// getStoreStatus.ts — single source of truth for the nav bar's Open/Closed
// status pill. Pure functions only (no React/DOM), so this is easy to unit
// test and reused identically wherever the store status needs to be computed.

export const STORE_TIMEZONE = 'America/Toronto'

const OPEN_HOUR = 10 // 10:00 AM
const CLOSE_HOUR = 17 // 5:00 PM

// Game-day timing (all relative to first pitch, in minutes):
// - Gates open a fixed 2 hours before first pitch.
// - The store closes to the general public BEFORE gates open, with a lead
//   time that depends on the day type of the GAME DATE:
//     * Weekday (Mon–Fri): 1 hour before gates  → first pitch − 3h
//     * Weekend (Sat–Sun): 2 hours before gates → first pitch − 4h
const GATE_OPEN_BEFORE_FIRST_PITCH = 120 // gates always open 2h before first pitch
const WEEKDAY_CLOSE_BEFORE_GATES = 60 // Mon–Fri: close 1h before gates
const WEEKEND_CLOSE_BEFORE_GATES = 120 // Sat–Sun: close 2h before gates

export type StoreStatusLabel = 'Open' | 'Closed' | 'Closed to the General Public'

export interface StoreStatusResult {
  isOpen: boolean
  statusLabel: StoreStatusLabel
  nextChange: string
}

/** Minimal shape needed from a GameDay row to compute today's status.
 * `date` is the game's calendar date as stored on GameDay.date (a UTC
 * calendar date, e.g. "2026-08-01T00:00:00.000Z"); when provided, the
 * weekday/weekend decision is made from the GAME DATE itself rather than
 * from "now", so the offset can never be skewed by server UTC vs
 * America/Toronto drift around midnight. */
export interface TodayGameInput {
  startTime: string | null | undefined
  date?: string | Date | null
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

/** Returns the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday) */
function getStoreDayOfWeek(date: Date, timeZone: string = STORE_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).formatToParts(date)
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days.indexOf(weekdayStr)
}

/** Day-of-week for the game itself. GameDay.date is a pure UTC calendar
 * date (Prisma `@db.Date`, midnight UTC) whose Y/M/D components ARE the
 * Toronto calendar date of the game — so its weekday is read from the UTC
 * components directly (formatting midnight-UTC in America/Toronto would
 * shift it back one day). Falls back to "now" in the store timezone when
 * the game date isn't supplied. */
function getGameDayOfWeek(todayGame: TodayGameInput, now: Date): number {
  if (todayGame.date) {
    const d = typeof todayGame.date === 'string' ? new Date(todayGame.date) : todayGame.date
    if (!isNaN(d.getTime())) return d.getUTCDay()
  }
  return getStoreDayOfWeek(now)
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
 * - Non-game day (or game day with no usable startTime): standard
 *   10:00 AM–5:00 PM Open window; before 10:00 AM it's Closed with
 *   "Opens at 10:00 AM".
 * - Game day with a valid startTime: gates open at first pitch − 2h, and
 *   the ticketed-only window starts BEFORE gates open — 1h before gates on
 *   weekdays (Mon–Fri), 2h before gates on weekends (Sat–Sun), where the
 *   day type comes from the GAME DATE in America/Toronto.
 *   Ticketed-only start = first pitch − 3h (weekday) / − 4h (weekend).
 *   From that instant until end of day, status is "Closed to the General
 *   Public", OVERRIDING whatever the normal hours-based status would be —
 *   including a plain "Closed" after the regular 5:00 PM close (evening
 *   games) and any "Open" state.
 * - Before the ticketed-only start, normal hours apply: Open from 10:00 AM
 *   until min(ticketedStart, 5:00 PM); an after-5 PM gap before a late
 *   ticketed window shows plain "Closed".
 * - Early-game edge case: if the ticketed-only start lands at or before
 *   the 10:00 AM opening, the store never opens to the general public that
 *   day — status is "Closed to the General Public" for the whole day
 *   (including before 10:00 AM, so we never promise "Opens at 10:00 AM"
 *   on a day it won't).
 */
export function getStoreStatus(now: Date, todayGame: TodayGameInput | null): StoreStatusResult {
  const nowMinutes = getStoreMinutes(now)
  const openMinutes = OPEN_HOUR * 60
  const closeMinutes = CLOSE_HOUR * 60

  const firstPitchMinutes = todayGame ? parseStartTimeToMinutes(todayGame.startTime) : null

  let ticketedStartMinutes: number | null = null
  if (todayGame && firstPitchMinutes !== null) {
    const gameDow = getGameDayOfWeek(todayGame, now)
    const isWeekendGame = gameDow === 0 || gameDow === 6
    const closeBeforeGates = isWeekendGame ? WEEKEND_CLOSE_BEFORE_GATES : WEEKDAY_CLOSE_BEFORE_GATES
    ticketedStartMinutes = firstPitchMinutes - GATE_OPEN_BEFORE_FIRST_PITCH - closeBeforeGates
  }

  // Ticketed-only override: from the ticketed-only start until end of day,
  // this state wins over any hours-based Open/Closed status.
  if (ticketedStartMinutes !== null && nowMinutes >= ticketedStartMinutes) {
    return { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' }
  }

  // Early-game edge case: ticketed-only start at/before the 10:00 AM opening
  // means the store never opens to the general public today — show the
  // restricted label all day rather than promising "Opens at 10:00 AM".
  if (ticketedStartMinutes !== null && ticketedStartMinutes <= openMinutes) {
    return { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' }
  }

  if (nowMinutes < openMinutes) {
    return { isOpen: false, statusLabel: 'Closed', nextChange: 'Opens at 10:00 AM' }
  }

  // Effective close is whichever comes first: the ticketed-only start (if
  // it's before the regular close) or the regular 5:00 PM close.
  const cutoffMinutes =
    ticketedStartMinutes !== null && ticketedStartMinutes < closeMinutes ? ticketedStartMinutes : closeMinutes

  if (nowMinutes < cutoffMinutes) {
    return { isOpen: true, statusLabel: 'Open', nextChange: `Closes at ${formatMinutesAsClock(cutoffMinutes)}` }
  }

  // Past the regular 5:00 PM close but before a late ticketed-only window
  // (or no game at all): plain Closed.
  return { isOpen: false, statusLabel: 'Closed', nextChange: 'Opens at 10:00 AM' }
}
