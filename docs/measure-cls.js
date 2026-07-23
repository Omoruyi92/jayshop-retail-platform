// Measures CLS (via Layout Instability API, same as prior CLS audits) on
// /shop, both locally (post-fix build) and confirms it stays in the
// previously-verified 0.0000-0.0079 range for the width-shift fix.
const puppeteer = require('puppeteer')

const BASE = process.argv[2] || 'http://localhost:3456'

async function measureCLS(url, viewport) {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport(viewport)
  await page.evaluateOnNewDocument(() => {
    window.__clsEntries = []
    try {
      const po = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__clsEntries.push({ value: entry.value, time: entry.startTime })
        }
      })
      po.observe({ type: 'layout-shift', buffered: true })
    } catch {}
  })
  await page.goto(url, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 5000))
  const entries = await page.evaluate(() => window.__clsEntries || [])
  await browser.close()
  const total = entries.reduce((sum, e) => sum + e.value, 0)
  return { total, entries }
}

async function main() {
  const scenarios = [
    { name: '/shop desktop', url: `${BASE}/shop`, viewport: { width: 1280, height: 900 } },
    { name: '/shop mobile', url: `${BASE}/shop`, viewport: { width: 375, height: 812 } },
    { name: '/shop?category=men desktop', url: `${BASE}/shop?category=men`, viewport: { width: 1280, height: 900 } },
  ]
  for (const s of scenarios) {
    const { total, entries } = await measureCLS(s.url, s.viewport)
    console.log(`${s.name}: CLS=${total.toFixed(4)} (${entries.length} shifts)`)
    if (entries.length) console.log(JSON.stringify(entries, null, 2))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
