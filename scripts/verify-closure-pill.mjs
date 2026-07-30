// Forced-time browser verification of the nav status pill closure logic.
// Mocks /api/game-days/next and overrides Date so the app believes it is a
// specific Toronto instant on a game day. Run with the dev server on :3000:
//   node scripts/verify-closure-pill.mjs
import { chromium } from 'playwright'

const scenarios = [
  {
    name: 'Weekday game (Wed 2026-08-05, 15:07 pitch) @ 11:00 AM EDT',
    fakeNow: '2026-08-05T11:00:00-04:00',
    gameDate: '2026-08-05T00:00:00.000Z',
    startTime: '15:07',
    expectLabel: 'Open',
    expectNext: 'Closes at 12:07 PM',
  },
  {
    name: 'Weekday game (Wed 2026-08-05, 15:07 pitch) @ 12:30 PM EDT',
    fakeNow: '2026-08-05T12:30:00-04:00',
    gameDate: '2026-08-05T00:00:00.000Z',
    startTime: '15:07',
    expectLabel: 'Closed to the General Public',
    expectNext: 'Ticketed fans only',
  },
  {
    name: 'Weekend game (Sat 2026-08-01, 15:07 pitch) @ 10:30 AM EDT',
    fakeNow: '2026-08-01T10:30:00-04:00',
    gameDate: '2026-08-01T00:00:00.000Z',
    startTime: '15:07',
    expectLabel: 'Open',
    expectNext: 'Closes at 11:07 AM',
  },
  {
    name: 'Weekend game (Sat 2026-08-01, 15:07 pitch) @ 11:30 AM EDT',
    fakeNow: '2026-08-01T11:30:00-04:00',
    gameDate: '2026-08-01T00:00:00.000Z',
    startTime: '15:07',
    expectLabel: 'Closed to the General Public',
    expectNext: 'Ticketed fans only',
  },
]

const browser = await chromium.launch()
let failed = 0

for (const s of scenarios) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const fakeNowMs = new Date(s.fakeNow).getTime()
  await ctx.addInitScript(`{
    const OriginalDate = Date;
    const fakeNowMs = ${fakeNowMs};
    class MockDate extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) { super(fakeNowMs) } else { super(...args) }
      }
      static now() { return fakeNowMs }
    }
    MockDate.parse = OriginalDate.parse;
    MockDate.UTC = OriginalDate.UTC;
    window.Date = MockDate;
  }`)
  await ctx.route('**/api/game-days/next', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ gameDay: { id: 'test', date: s.gameDate, opponent: 'Test', note: null, startTime: s.startTime } }),
    }),
  )
  const page = await ctx.newPage()
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' })
  // Pill populates in a useEffect after fetch; wait for a non-blank label.
  const badge = page.locator('div.xl\\:block >> text=Jays Shop').first()
  await page.waitForTimeout(2500)
  const text = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('span'))
    const label = nodes.find((n) => ['Open', 'Closed', 'Closed to the General Public'].includes(n.textContent?.trim()))
    if (!label) return null
    const row = label.closest('div')
    return row ? row.textContent : label.textContent
  })
  const ok = text && text.includes(s.expectLabel) && text.includes(s.expectNext)
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${s.name}`)
  console.log(`       pill row text: ${JSON.stringify(text)}`)
  console.log(`       expected to contain: ${JSON.stringify(s.expectLabel)} + ${JSON.stringify(s.expectNext)}`)
  const shot = `/tmp/pill-${s.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`
  await page.screenshot({ path: shot, clip: { x: 0, y: 0, width: 1600, height: 140 } })
  console.log(`       screenshot: ${shot}`)
  await ctx.close()
}

await browser.close()
console.log(failed === 0 ? '\nAll browser scenarios passed' : `\n${failed} scenario(s) FAILED`)
process.exit(failed === 0 ? 0 : 1)
