// Fine-grained (every ~16ms) screenshot-only capture of the first 500ms of
// a PDP hard reload, to catch any nav-bar flash/instability that the
// coarser repro-pdp-issues.js script might miss due to execution-context
// invalidation right at navigation start.
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const BASE = process.argv[2] || 'https://jayshop-retail-platform.vercel.app'
const SLUG = process.argv[3] || 'toronto-blue-jays-camden-women-s-insignia-2-0'
const OUT = process.argv[4] || '/tmp/pdp-repro/fine'
const VP = { width: 390, height: 844 } // mobile, matches user's phone-like recording aspect

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport(VP)
  await page.setCacheEnabled(false)
  const client = await page.createCDPSession()
  await client.send('Network.clearBrowserCache')
  await client.send('Network.setCacheDisabled', { cacheDisabled: true })

  const url = `${BASE}/shop/${SLUG}`
  const navStart = Date.now()
  page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {})

  let i = 0
  while (Date.now() - navStart < 900) {
    const t = Date.now() - navStart
    try {
      await page.screenshot({ path: path.join(OUT, `f_${String(t).padStart(4, '0')}ms.png`) })
    } catch (e) {
      console.log(t, 'shot error', e.message)
    }
    i++
    await new Promise((r) => setTimeout(r, 16))
  }
  console.log('captured', i, 'frames')
  await browser.close()
}

run()
