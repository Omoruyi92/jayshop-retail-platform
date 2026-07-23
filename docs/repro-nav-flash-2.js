// Reproduction script #2 — simulates a realistic user session where the
// customer already browsed a category (leaving sessionStorage filter state),
// then reloads /shop or navigates to a DIFFERENT category — the scenario
// where ShopPageClient's post-mount useEffect (reading sessionStorage) can
// diverge from the SSR-correct `activeCategory` prop.
const puppeteer = require('puppeteer')

const BASE = 'https://jayshop-retail-platform.vercel.app'
const OUT = '/Users/idehenomoruyi/projects/jays-shop/docs/deliverables/nav-flash-repro'

const OFFSETS_MS = [0, 30, 60, 100, 150, 200, 300, 450, 650, 900, 1300]

async function getNavState(page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'))
    const activePills = links
      .filter((a) => a.className.includes('bg-jays-navy') && a.className.includes('text-white'))
      .map((a) => a.textContent?.trim())
    const mobileLabelEl = document.querySelector('span.text-jays-navy.font-semibold, span.font-semibold.text-jays-navy')
    const mobileLabel = mobileLabelEl ? mobileLabelEl.textContent?.trim() : null
    let sessionState = null
    try { sessionState = sessionStorage.getItem('jays-shop-filter-state') } catch {}
    return {
      activePills,
      mobileLabel,
      url: window.location.href,
      ready: document.readyState,
      sessionState,
    }
  }).catch((e) => ({ error: String(e) }))
}

async function captureTimeline(page, label, viewport) {
  const start = Date.now()
  const results = []
  for (const offset of OFFSETS_MS) {
    const wait = offset - (Date.now() - start)
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    const state = await getNavState(page)
    const shotPath = `${OUT}/${label}-t${offset}.png`
    await page.screenshot({ path: shotPath, clip: { x: 0, y: 0, width: viewport.width, height: 220 } }).catch(() => {})
    results.push({ offset, elapsed: Date.now() - start, state, shotPath })
  }
  return results
}

async function scenario(browser, name, viewport) {
  const page = await browser.newPage()
  await page.setViewport(viewport)

  // Step 1: visit /shop?category=women to populate sessionStorage with
  // "women" filter state (simulates prior browsing).
  await page.goto(`${BASE}/shop?category=women`, { waitUntil: 'networkidle2' })
  await new Promise((r) => setTimeout(r, 800))

  // Step 2: reload plain /shop (category=All requested) — does the nav
  // briefly show "Women" (stale sessionStorage) before correcting to "All"?
  await page.goto(`${BASE}/shop`, { waitUntil: 'domcontentloaded' })
  const reloadAll = await captureTimeline(page, `${name}-reload-plain-shop`, viewport)

  // Step 3: now navigate directly (fresh load) to /shop?category=men while
  // sessionStorage still holds "women" — does it flash Women before Men?
  await page.goto(`${BASE}/shop?category=men`, { waitUntil: 'domcontentloaded' })
  const reloadMen = await captureTimeline(page, `${name}-reload-to-men-with-women-cached`, viewport)

  await page.close()
  return { reloadAll, reloadMen }
}

async function main() {
  const fs = require('fs')
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({ headless: 'new' })
  const report = {}
  report['desktop'] = await scenario(browser, 'desktop', { width: 1280, height: 900 })
  report['mobile'] = await scenario(browser, 'mobile', { width: 375, height: 812 })
  await browser.close()
  fs.writeFileSync(`${OUT}/report2.json`, JSON.stringify(report, null, 2))
  console.log('Done. Report at', `${OUT}/report2.json`)
}

main().catch((e) => { console.error(e); process.exit(1) })
