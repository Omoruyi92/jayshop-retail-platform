// Reproduction script for sticky category nav incorrect-state flash.
// Captures screenshots + DOM snapshots of the active pill / filter state at
// multiple time offsets after reload, on live production.
const puppeteer = require('puppeteer')

const BASE = 'https://jayshop-retail-platform.vercel.app'
const OUT = '/Users/idehenomoruyi/projects/jays-shop/docs/deliverables/nav-flash-repro'

const SCENARIOS = [
  { name: 'shop-all-desktop', url: `${BASE}/shop`, viewport: { width: 1280, height: 900 } },
  { name: 'shop-men-desktop', url: `${BASE}/shop?category=men`, viewport: { width: 1280, height: 900 } },
  { name: 'shop-all-mobile', url: `${BASE}/shop`, viewport: { width: 375, height: 812 } },
  { name: 'shop-men-mobile', url: `${BASE}/shop?category=men`, viewport: { width: 375, height: 812 } },
]

const OFFSETS_MS = [0, 50, 100, 150, 200, 300, 400, 600, 900, 1300, 1800]

async function getNavState(page) {
  return page.evaluate(() => {
    // Find active pill (desktop) — bg-jays-navy class marks active
    const links = Array.from(document.querySelectorAll('a'))
    const activePills = links
      .filter((a) => a.className.includes('bg-jays-navy') && a.className.includes('text-white'))
      .map((a) => a.textContent?.trim())
    // Mobile label
    const mobileLabelEl = document.querySelector('span.text-jays-navy.font-semibold, span.font-semibold.text-jays-navy')
    const mobileLabel = mobileLabelEl ? mobileLabelEl.textContent?.trim() : null
    return {
      activePills,
      mobileLabel,
      url: window.location.href,
      ready: document.readyState,
    }
  }).catch(() => null)
}

async function runScenario(browser, scenario, mode) {
  const page = await browser.newPage()
  await page.setViewport(scenario.viewport)
  if (mode === 'hard-reload') {
    await page.setCacheEnabled(false)
  }
  await page.goto(scenario.url, { waitUntil: 'domcontentloaded' })
  const start = Date.now()
  const results = []
  for (const offset of OFFSETS_MS) {
    const wait = offset - (Date.now() - start)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    const state = await getNavState(page)
    const shotPath = `${OUT}/${scenario.name}-${mode}-t${offset}.png`
    await page.screenshot({ path: shotPath, clip: { x: 0, y: 0, width: scenario.viewport.width, height: 220 } }).catch(() => {})
    results.push({ offset, elapsed: Date.now() - start, state, shotPath })
  }
  await page.close()
  return results
}

async function main() {
  const fs = require('fs')
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({ headless: 'new' })
  const report = {}
  for (const scenario of SCENARIOS) {
    for (const mode of ['normal', 'hard-reload']) {
      const key = `${scenario.name}-${mode}`
      console.log('Running', key)
      report[key] = await runScenario(browser, scenario, mode)
    }
  }
  await browser.close()
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
  console.log('Done. Report at', `${OUT}/report.json`)
}

main().catch((e) => { console.error(e); process.exit(1) })
