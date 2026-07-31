// Forced-time browser verification of the weekday(1h)/weekend(2h)
// before-gates ticketed-only override. Mocks /api/game-days/next and
// overrides Date so the app believes it is a specific Toronto instant.
// Run with the dev server on :3000 (override with BASE_URL):
//   node scripts/verify-gameday-offset.mjs
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const OUT_DIR = 'docs/verification/gameday-status-offset'

const scenarios = [
  {
    name: 'weekday-before-window-open',
    label: 'Weekday Fri 2026-07-31, 19:07 pitch (gates 17:07) @ 4:06 PM — 61 min before gates → Open',
    fakeNow: '2026-07-31T16:06:00-04:00',
    gameDate: '2026-07-31T00:00:00.000Z',
    startTime: '19:07',
    expectLabel: 'Open',
    expectNext: 'Closes at 4:07 PM',
  },
  {
    name: 'weekday-in-window-ticketed',
    label: 'Weekday Fri 2026-07-31, 19:07 pitch (gates 17:07) @ 4:08 PM — 59 min before gates → Ticketed-only',
    fakeNow: '2026-07-31T16:08:00-04:00',
    gameDate: '2026-07-31T00:00:00.000Z',
    startTime: '19:07',
    expectLabel: 'Closed to the General Public',
    expectNext: 'Ticketed fans only',
  },
  {
    name: 'weekday-after-5pm-override',
    label: 'Weekday Fri 2026-07-31, 19:07 pitch @ 6:00 PM — override wins over plain after-hours Closed',
    fakeNow: '2026-07-31T18:00:00-04:00',
    gameDate: '2026-07-31T00:00:00.000Z',
    startTime: '19:07',
    expectLabel: 'Closed to the General Public',
    expectNext: 'Ticketed fans only',
  },
  {
    name: 'weekend-before-window-open',
    label: 'Weekend Sat 2026-08-08, 19:07 pitch (gates 17:07) @ 3:06 PM — 121 min before gates → Open',
    fakeNow: '2026-08-08T15:06:00-04:00',
    gameDate: '2026-08-08T00:00:00.000Z',
    startTime: '19:07',
    expectLabel: 'Open',
    expectNext: 'Closes at 3:07 PM',
  },
  {
    name: 'weekend-in-window-ticketed',
    label: 'Weekend Sat 2026-08-08, 19:07 pitch (gates 17:07) @ 3:08 PM — 119 min before gates → Ticketed-only',
    fakeNow: '2026-08-08T15:08:00-04:00',
    gameDate: '2026-08-08T00:00:00.000Z',
    startTime: '19:07',
    expectLabel: 'Closed to the General Public',
    expectNext: 'Ticketed fans only',
  },
  {
    name: 'weekend-late-game-override-after-closed',
    label: 'Weekend Sat 2026-08-01, 22:00 pitch (gates 20:00) @ 6:00 PM — override after regular 5 PM close',
    fakeNow: '2026-08-01T18:00:00-04:00',
    gameDate: '2026-08-01T00:00:00.000Z',
    startTime: '22:00',
    expectLabel: 'Closed to the General Public',
    expectNext: 'Ticketed fans only',
  },
]

const viewports = [
  { tag: 'desktop', viewport: { width: 1600, height: 900 }, clip: { x: 0, y: 0, width: 1600, height: 150 } },
  { tag: 'mobile', viewport: { width: 390, height: 844 }, clip: { x: 0, y: 0, width: 390, height: 220 } },
]

const browser = await chromium.launch()
let failed = 0

for (const s of scenarios) {
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: vp.viewport, isMobile: vp.tag === 'mobile' })
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
        body: JSON.stringify({ gameDay: { id: 'test', date: s.gameDate, opponent: 'Cardinals', note: null, startTime: s.startTime } }),
      }),
    )
    const page = await ctx.newPage()
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' })
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
    console.log(`${ok ? 'PASS' : 'FAIL'} | [${vp.tag}] ${s.label}`)
    console.log(`       pill row text: ${JSON.stringify(text)}`)
    const shot = `${OUT_DIR}/${s.name}-${vp.tag}.png`
    await page.screenshot({ path: shot, clip: vp.clip })
    console.log(`       screenshot: ${shot}`)
    await ctx.close()
  }
}

await browser.close()
console.log(failed === 0 ? '\nAll browser scenarios passed' : `\n${failed} scenario(s) FAILED`)
process.exit(failed === 0 ? 0 : 1)
