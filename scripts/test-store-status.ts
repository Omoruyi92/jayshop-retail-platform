// Unit test matrix for getStoreStatus weekday/weekend gate-offset closure.
// Run: npx tsx scripts/test-store-status.ts
// Pure-function tests — no DB, no network. "Now" instants are constructed
// as UTC Dates corresponding to America/Toronto local times (EDT = UTC-4
// for all summer dates used here; one EST case included).

import { getStoreStatus, type TodayGameInput } from '../src/lib/store/getStoreStatus'

let passed = 0
let failed = 0
const rows: string[] = []

/** Toronto local time (EDT, UTC-4) → UTC Date */
function edt(dateStr: string, h: number, m: number): Date {
  return new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-04:00`)
}

function game(dateStr: string, startTime: string | null): TodayGameInput {
  return { startTime, date: `${dateStr}T00:00:00.000Z` }
}

function check(
  name: string,
  now: Date,
  g: TodayGameInput | null,
  expect: { isOpen: boolean; statusLabel: string; nextChange: string },
) {
  const r = getStoreStatus(now, g)
  const ok = r.isOpen === expect.isOpen && r.statusLabel === expect.statusLabel && r.nextChange === expect.nextChange
  if (ok) passed++
  else failed++
  rows.push(
    `${ok ? 'PASS' : 'FAIL'} | ${name}\n       got:      ${JSON.stringify(r)}\n       expected: ${JSON.stringify(expect)}`,
  )
}

// ─── Weekday game: Wed 2026-08-05, first pitch 15:07 → gates 13:07 → public close 12:07 ───
const wedGame = game('2026-08-05', '15:07')
check('Weekday game: 11:00 AM → Open, closes 12:07 PM', edt('2026-08-05', 11, 0), wedGame,
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 12:07 PM' })
check('Weekday game: 12:06 PM → still Open', edt('2026-08-05', 12, 6), wedGame,
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 12:07 PM' })
check('Weekday game: 12:07 PM → Closed to the General Public', edt('2026-08-05', 12, 7), wedGame,
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })
check('Weekday game: before 10 AM → Closed, opens 10 AM', edt('2026-08-05', 9, 30), wedGame,
  { isOpen: false, statusLabel: 'Closed', nextChange: 'Opens at 10:00 AM' })

// ─── Weekend game: Sat 2026-08-01, first pitch 15:07 → gates 13:07 → public close 11:07 ───
const satGame = game('2026-08-01', '15:07')
check('Weekend game: 10:30 AM → Open, closes 11:07 AM', edt('2026-08-01', 10, 30), satGame,
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 11:07 AM' })
check('Weekend game: 11:06 AM → still Open', edt('2026-08-01', 11, 6), satGame,
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 11:07 AM' })
check('Weekend game: 11:07 AM → Closed to the General Public', edt('2026-08-01', 11, 7), satGame,
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })
check('Weekend game (Sun 2026-08-02): 12:00 PM → Closed to the General Public', edt('2026-08-02', 12, 0),
  game('2026-08-02', '15:07'),
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })

// ─── Boundary: same 15:07 first pitch — Fri vs Sat ───
check('Boundary Fri 2026-08-07 15:07 game: 11:30 AM → Open, closes 12:07 PM (weekday offset)',
  edt('2026-08-07', 11, 30), game('2026-08-07', '15:07'),
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 12:07 PM' })
check('Boundary Sat 2026-08-08 15:07 game: 11:30 AM → Closed to public (weekend offset, closed 11:07)',
  edt('2026-08-08', 11, 30), game('2026-08-08', '15:07'),
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })

// ─── Closure-before-open edge: very early first pitch ───
// Sat 13:07 first pitch → gates 11:07 → public close 9:07 AM (< 10 AM open):
// never opens to the public that day, all-day restricted label.
const earlySat = game('2026-08-08', '13:07')
check('Early weekend game: 8:00 AM → Closed to the General Public (never opens)', edt('2026-08-08', 8, 0), earlySat,
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })
check('Early weekend game: 12:00 PM → Closed to the General Public', edt('2026-08-08', 12, 0), earlySat,
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })
// Weekday 13:00 first pitch → gates 11:00 → public close 10:00 == open → never opens (boundary <=)
check('Weekday 13:00 game (close == 10 AM open): 10:30 AM → Closed to the General Public',
  edt('2026-08-05', 10, 30), game('2026-08-05', '13:00'),
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })

// ─── Evening game: public close after 5 PM → regular hours win ───
// Wed 19:07 first pitch → gates 17:07 → public close 16:07 (< 17:00) → closes 4:07 PM
check('Weekday evening 19:07 game: 3:00 PM → Open, closes 4:07 PM', edt('2026-08-05', 15, 0), game('2026-08-05', '19:07'),
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 4:07 PM' })
// Sat 22:00 first pitch → gates 20:00 → public close 18:00 (> 17:00) → regular 5 PM close, plain Closed
const lateSat = game('2026-08-01', '22:00')
check('Weekend late 22:00 game: 4:00 PM → Open, closes 5:00 PM (regular close wins)', edt('2026-08-01', 16, 0), lateSat,
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 5:00 PM' })
check('Weekend late 22:00 game: 5:30 PM → plain Closed', edt('2026-08-01', 17, 30), lateSat,
  { isOpen: false, statusLabel: 'Closed', nextChange: 'Opens at 10:00 AM' })

// ─── Doubleheader: GameDay.date is @unique — one row per date; startTime is
// the earliest first pitch by construction. Sat 13:37 earliest pitch →
// public close 9:37 AM (< 10 AM) → never opens to public. Also verify a Sat
// 14:07 earliest pitch → close 10:07 (brief 10:00–10:07 open window). ───
check('Doubleheader Sat (earliest pitch 13:37): 9:30 AM → never opens to public', edt('2026-08-01', 9, 30),
  game('2026-08-01', '13:37'),
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })
check('Doubleheader Sat (earliest pitch 14:07): 10:05 AM → brief Open until 10:07', edt('2026-08-01', 10, 5),
  game('2026-08-01', '14:07'),
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 10:07 AM' })

// ─── Non-game day: unchanged 10 AM–5 PM ───
check('Non-game day: 9:00 AM → Closed, opens 10 AM', edt('2026-08-05', 9, 0), null,
  { isOpen: false, statusLabel: 'Closed', nextChange: 'Opens at 10:00 AM' })
check('Non-game day: 12:00 PM → Open, closes 5 PM', edt('2026-08-05', 12, 0), null,
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 5:00 PM' })
check('Non-game day: 6:00 PM → Closed', edt('2026-08-05', 18, 0), null,
  { isOpen: false, statusLabel: 'Closed', nextChange: 'Opens at 10:00 AM' })

// ─── No-game fallbacks: game row without usable startTime → regular hours ───
check('Game day, null startTime: 12:00 PM → regular Open', edt('2026-08-01', 12, 0), game('2026-08-01', null),
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 5:00 PM' })
check('Game day, malformed startTime: 12:00 PM → regular Open', edt('2026-08-01', 12, 0),
  game('2026-08-01', '25:99'),
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 5:00 PM' })

// ─── Game date drives day type, not "now" tz drift: game without date field
// falls back to now-in-Toronto weekday. ───
check('Game with no date field on a Saturday now → weekend offset applied', edt('2026-08-01', 11, 30),
  { startTime: '15:07' },
  { isOpen: false, statusLabel: 'Closed to the General Public', nextChange: 'Ticketed fans only' })

// ─── EST sanity (April weekday game, UTC-4 is still EDT in April; use a
// January-style EST instant to prove tz math holds year-round) ───
check('EST winter non-game day: 11:00 AM EST → Open', new Date('2026-01-14T11:00:00-05:00'), null,
  { isOpen: true, statusLabel: 'Open', nextChange: 'Closes at 5:00 PM' })

console.log(rows.join('\n'))
console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total`)
if (failed > 0) process.exit(1)
