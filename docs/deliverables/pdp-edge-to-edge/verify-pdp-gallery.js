const puppeteer = require('puppeteer')
const path = require('path')

const URL = process.argv[2] || 'http://localhost:3000/shop/women-s-nike-toronto-blue-jays-white-home-limited-jersey'
const OUT_DIR = process.argv[3] || '/Users/idehenomoruyi/projects/jays-shop/docs/deliverables/pdp-edge-to-edge'
const TAG = process.argv[4] || 'local'

const widths = [320, 375, 390, 414, 428, 1280]

;(async () => {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  for (const width of widths) {
    await page.setViewport({ width, height: 900 })
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))

    const galleryBox = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      // Find the main product gallery image (largest visible img on page)
      let best = null
      for (const img of imgs) {
        const r = img.getBoundingClientRect()
        const area = r.width * r.height
        if (!best || area > best.area) best = { area, rect: { x: r.x, y: r.y, width: r.width, height: r.height }, src: img.src }
      }
      return best
    })

    console.log(`[width=${width}] scrollWidth=${overflow.scrollWidth} innerWidth=${overflow.innerWidth} overflow=${overflow.scrollWidth > overflow.innerWidth} galleryImgRect=${JSON.stringify(galleryBox && galleryBox.rect)}`)

    const shotPath = path.join(OUT_DIR, `${TAG}-${width}.png`)
    await page.screenshot({ path: shotPath })
    console.log(`  saved ${shotPath}`)
  }

  // Test arrow/dot/thumbnail interactivity at 375px
  await page.setViewport({ width: 375, height: 900 })
  for (let attempt = 1; attempt <= 5; attempt++) {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 1500))
    const hasNav = await page.$('button[aria-label="Next image"]')
    if (hasNav) break
    console.log(`  retry ${attempt}: nav buttons not found yet (possible transient DB error), retrying...`)
    await new Promise((r) => setTimeout(r, 3000))
  }

  const nextBtn = await page.$('button[aria-label="Next image"]')
  if (nextBtn) {
    await nextBtn.click()
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(OUT_DIR, `${TAG}-375-after-next-click.png`) })
    console.log('  clicked Next arrow, screenshot saved')
  } else {
    console.log('  Next arrow button NOT FOUND')
  }

  const thumbs = await page.$$('button img[alt*="View"], button img[alt*="Front"], button img[alt*="Back"]')
  console.log(`  thumbnail count found: ${thumbs.length}`)

  const dots = await page.$$('button[aria-label*="Image"], button[aria-label*="View"], button[aria-label*="Front"], button[aria-label*="Back"]')
  console.log(`  dot/label buttons found: ${dots.length}`)

  await browser.close()
})()
