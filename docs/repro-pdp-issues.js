// Reproduces PDP hard-reload issues: layout instability/CLS and any
// "empty navigation bar" state within StickyShopCategoryNav. Captures
// screenshots + DOM measurements at fine time offsets after a hard reload
// (cache disabled) on a known product detail page, desktop + mobile.
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const BASE = process.argv[2] || 'https://jayshop-retail-platform.vercel.app'
const SLUG = process.argv[3] || 'toronto-blue-jays-camden-women-s-insignia-2-0'
const OUT = process.argv[4] || '/tmp/pdp-repro'
const OFFSETS_MS = [0, 50, 100, 200, 300, 500, 800, 1200, 2000]

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}

async function measure(page) {
  return page.evaluate(() => {
    const header = document.querySelector('header') || document.querySelector('[class*="Header"]')
    const subnav = document.querySelectorAll('nav')
    const sticky = Array.from(document.querySelectorAll('*')).filter((el) => {
      const cs = getComputedStyle(el)
      return cs.position === 'sticky' || cs.position === 'fixed'
    }).map((el) => {
      const r = el.getBoundingClientRect()
      return {
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 80),
        top: r.top, height: r.height, width: r.width,
        text: (el.textContent || '').trim().slice(0, 60),
      }
    })
    return {
      scrollHeight: document.documentElement.scrollHeight,
      subnavCount: subnav.length,
      sticky,
      headerVar: getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      subnavVar: getComputedStyle(document.documentElement).getPropertyValue('--subnav-height'),
    }
  })
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({ headless: 'new' })
  const url = `${BASE}/shop/${SLUG}`

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage()
    await page.setViewport(vp)
    await page.setCacheEnabled(false)
    const client = await page.createCDPSession()
    await client.send('Network.clearBrowserCache')
    await client.send('Network.setCacheDisabled', { cacheDisabled: true })

    console.log(`\n=== ${vpName} hard reload ===`)
    const navStart = Date.now()
    page.goto(url, { waitUntil: 'domcontentloaded' }).catch((e) => console.log('goto error', e.message))

    for (const offset of OFFSETS_MS) {
      const wait = offset - (Date.now() - navStart)
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      const label = `t${String(offset).padStart(5, '0')}ms`
      try {
        await page.screenshot({ path: path.join(OUT, `${vpName}_${label}.png`) })
        const m = await measure(page)
        console.log(label, JSON.stringify(m))
      } catch (e) {
        console.log(label, 'ERROR', e.message)
      }
    }

    // Check console errors
    await page.close()
  }

  await browser.close()
}

run()
