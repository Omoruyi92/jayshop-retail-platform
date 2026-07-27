// Inspects StickyShopCategoryNav's interactive panels (mobile "Categories"
// button, desktop category pill hover flyout) on the PDP to check for any
// panel that renders but ends up visually empty (the "empty navigation bar"
// complaint), plus captures screenshots of each state for review.
const puppeteer = require('puppeteer')
const path = require('path')

const BASE = process.argv[2] || 'https://jayshop-retail-platform.vercel.app'
const SLUG = process.argv[3] || 'toronto-blue-jays-camden-women-s-insignia-2-0'
const OUT = '/tmp/pdp-repro/panels'

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' })

  // --- Mobile: open the "Categories" flyout ---
  {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844 })
    await page.goto(`${BASE}/shop/${SLUG}`, { waitUntil: 'load', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(OUT, 'mobile_loaded.png') })

    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Categories'))
      if (btn) { btn.click(); return true }
      return false
    })
    console.log('mobile Categories button clicked:', clicked)
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(OUT, 'mobile_categories_open.png') })

    const panelInfo = await page.evaluate(() => {
      // Find newly visible panel-like elements with role or specific classes
      const candidates = Array.from(document.querySelectorAll('div,nav')).filter((el) => {
        const r = el.getBoundingClientRect()
        return r.height > 20 && r.width > 100 && getComputedStyle(el).position !== 'static' && el.textContent && el.textContent.trim().length < 5
      })
      return candidates.slice(0, 10).map((el) => ({
        tag: el.tagName, cls: (el.className || '').toString().slice(0, 100),
        text: JSON.stringify(el.textContent?.trim()),
        rect: el.getBoundingClientRect(),
      }))
    })
    console.log('near-empty floating panels:', JSON.stringify(panelInfo, null, 2))
    await page.close()
  }

  // --- Desktop: hover a category pill to open its flyout ---
  {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })
    await page.goto(`${BASE}/shop/${SLUG}`, { waitUntil: 'load', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1500))
    await page.screenshot({ path: path.join(OUT, 'desktop_loaded.png') })

    const pillRect = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find((a) => a.textContent?.trim() === 'Women')
      if (!link) return null
      const r = link.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    })
    console.log('Women pill rect:', pillRect)
    if (pillRect) {
      await page.mouse.move(pillRect.x, pillRect.y)
      await new Promise((r) => setTimeout(r, 400))
      await page.screenshot({ path: path.join(OUT, 'desktop_women_hover.png') })
    }
    await page.close()
  }

  await browser.close()
}

run().catch((e) => { console.error(e); process.exit(1) })
