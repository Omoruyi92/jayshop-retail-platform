// One-off proof-capture for the mobile-landscape header cleanup.
// Captures the blue header row at landscape phone viewports in both the
// normal (Closed/Open) state and the game-day "Closed to the General
// Public · Ticketed fans only" state (mocked via route interception of
// /api/game-days/next), plus portrait + desktop regression shots.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.PROOF_URL || 'http://localhost:3000'
const OUT_DIR = process.env.PROOF_OUT || '/Users/idehenomoruyi/projects/jays-shop/docs/header-landscape-proof'

const CASES = [
  // Mobile landscape — the target of this change
  { name: 'landscape-667x375', width: 667, height: 375 },
  { name: 'landscape-812x375', width: 812, height: 375 },
  { name: 'landscape-844x390', width: 844, height: 390 },
  // Regression: portrait + desktop must be unchanged
  { name: 'portrait-375x667', width: 375, height: 667 },
  { name: 'portrait-390x844', width: 390, height: 844 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
]

// Build a gameDay payload whose ticketed-only window is active "now":
// startTime very early → ticketedStart negative → override wins all day.
function todayGamePayload() {
  const now = new Date()
  const iso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
  return { gameDay: { date: iso, startTime: '13:00' } }
}

async function checkHeaderOverlap(page) {
  return page.evaluate(() => {
    const header = document.querySelector('header')
    if (!header) return { ok: false, reason: 'no-header' }
    const row = header.querySelector(':scope > div')
    const pillWrap = header.querySelector('div.xl\\:hidden > div') // status pill (hidden at xl+)
    const actions = header.querySelector('div.shrink-0:last-of-type') // right action cluster
    const pill = pillWrap ? pillWrap.getBoundingClientRect() : null
    // Right action cluster = the bell button's enclosing flex group; use the
    // notification bell (first button with aria-label containing "otification")
    // or the favorites/cart buttons — take the leftmost visible action icon.
    const iconButtons = [...header.querySelectorAll('button[aria-label]')].filter((b) => {
      const l = b.getAttribute('aria-label') || ''
      return /notification|favorites|cart/i.test(l)
    })
    let actionsLeftEdge = null
    for (const b of iconButtons) {
      const r = b.getBoundingClientRect()
      if (r.width > 0 && (actionsLeftEdge === null || r.left < actionsLeftEdge)) actionsLeftEdge = r.left
    }
    const rowRect = row ? row.getBoundingClientRect() : null
    const pillOverlapsActions = pill && actionsLeftEdge !== null ? pill.right > actionsLeftEdge + 1 : false
    const pillText = pillWrap ? pillWrap.innerText.replace(/\n/g, ' | ') : null
    const pillLines = pillWrap
      ? Math.round(pillWrap.getBoundingClientRect().height / 12)
      : null
    const wordmarkVisible = (() => {
      const spans = header.querySelectorAll('a[aria-label="Jays Shop home"] span')
      for (const s of spans) {
        if (s.textContent && s.textContent.includes('Toronto Blue Jays')) {
          const r = s.getBoundingClientRect()
          return r.width > 0 && r.height > 0 && getComputedStyle(s.parentElement).display !== 'none'
        }
      }
      return false
    })()
    const mlb = header.querySelector('div.shrink-0 svg, div.shrink-0 img[alt*="MLB"], [class*="MLB"]')
    return {
      ok: true,
      rowHeight: rowRect ? rowRect.height : null,
      pillRect: pill ? { left: Math.round(pill.left), right: Math.round(pill.right), top: Math.round(pill.top), bottom: Math.round(pill.bottom), h: Math.round(pill.height) } : null,
      actionsLeft: actionsLeftEdge !== null ? Math.round(actionsLeftEdge) : null,
      pillOverlapsActions,
      pillText,
      wordmarkVisible,
    }
  })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const report = []

  for (const mockGame of [false, true]) {
    for (const vp of CASES) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 })
      // Pre-seed cookie consent so the consent modal (z-[100], blurs the
      // page) never appears in the captures.
      await context.addCookies([
        {
          name: 'jays_consent',
          value: encodeURIComponent(JSON.stringify({ v: 1, acceptedAt: new Date().toISOString() })),
          url: BASE_URL,
        },
      ])
      await context.addInitScript(() => {
        try {
          window.localStorage.setItem('jays-shop-consent', JSON.stringify({ v: 1, acceptedAt: new Date().toISOString() }))
        } catch {}
      })
      const page = await context.newPage()
      await page.route('**/api/game-days/next', async (route) => {
        if (mockGame) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(todayGamePayload()) })
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ gameDay: null }) })
        }
      })
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      // Wait for the branded initial-load overlay to fully fade + unmount,
      // and for the status pill to resolve past its transparent pending state.
      await page.waitForSelector('[data-initial-load-overlay]', { state: 'detached', timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(1500)
      const state = mockGame ? 'ticketed' : 'normal'
      const fname = `header_${vp.name}_${state}.png`
      const fpath = path.join(OUT_DIR, fname)
      const header = page.locator('header').first()
      await header.screenshot({ path: fpath })
      const metrics = await checkHeaderOverlap(page)
      report.push({ viewport: vp, state, file: fpath, metrics })
      console.log(`[${vp.name} ${state}] overlap=${metrics.pillOverlapsActions} wordmark=${metrics.wordmarkVisible} pill=${JSON.stringify(metrics.pillRect)} actionsLeft=${metrics.actionsLeft}`)
      console.log(`   pillText: ${metrics.pillText}`)
      await context.close()
    }
  }

  await browser.close()
  const reportPath = path.join(OUT_DIR, 'report.json')
  await (await import('node:fs/promises')).writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log('Report written to', reportPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
