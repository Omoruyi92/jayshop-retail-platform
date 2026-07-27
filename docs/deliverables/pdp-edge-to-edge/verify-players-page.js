const puppeteer = require('puppeteer')
const path = require('path')

const URL = 'http://localhost:3000/players/addison-barger'
const OUT_DIR = '/Users/idehenomoruyi/projects/jays-shop/docs/deliverables/pdp-edge-to-edge'

;(async () => {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  for (const width of [375, 1280]) {
    await page.setViewport({ width, height: 900 })
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1200))
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
    console.log(`players page width=${width} overflow=${overflow.scrollWidth > overflow.innerWidth}`, overflow)
    await page.screenshot({ path: path.join(OUT_DIR, `players-page-${width}.png`) })
  }
  await browser.close()
})()
