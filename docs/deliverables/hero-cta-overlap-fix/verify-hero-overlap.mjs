// Geometry verification for the Store Gallery hero CTA / slideshow-controls
// overlap fix. Not part of the app build — a standalone one-off script run
// against a local dev server to produce measured evidence (not a "looks
// fine" screenshot check).
//
// Usage: node verify-hero-overlap.mjs [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')
mkdirSync(SCREENSHOT_DIR, { recursive: true })

const baseUrl = process.argv[2] || 'http://localhost:3000'

const viewports = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '414x896', width: 414, height: 896 },
  { name: '844x390-landscape', width: 844, height: 390 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1920x1080', width: 1920, height: 1080 },
]

function rectsGap(a, b) {
  // Returns the minimum clear gap between two axis-aligned rects.
  // Positive = separated by that many px. Negative = overlapping by that many px.
  const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width))
  const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height))
  if (dx >= 0 || dy >= 0) {
    // Not overlapping on at least one axis — real gap is the max of the
    // separating axis distances (the smallest distance you'd need to
    // travel to touch the other rect).
    return Math.max(dx, dy)
  }
  // Overlapping on both axes — report negative penetration depth (the
  // smaller of the two overlap depths, i.e. how far you'd need to move to
  // stop overlapping).
  return Math.max(dx, dy) // both negative here; max = least negative = min push-out distance
}

function intersects(a, b) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)
}

const results = []

const browser = await chromium.launch()
try {
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    await page.goto(`${baseUrl}/gallery`, { waitUntil: 'networkidle' })

    // Let the slideshow ResizeObserver / first-slide fade settle.
    await page.waitForTimeout(600)

    const cta = page.getByRole('link', { name: /Find us at Rogers Centre/i })
    const prevBtn = page.getByRole('button', { name: 'Previous slide' })
    const playBtn = page.getByRole('button', { name: /Pause slideshow|Play slideshow/i })
    const nextBtn = page.getByRole('button', { name: 'Next slide' })

    await cta.waitFor({ state: 'visible', timeout: 10000 })
    await prevBtn.waitFor({ state: 'visible', timeout: 10000 })

    const ctaBox = await cta.boundingBox()
    const prevBox = await prevBtn.boundingBox()
    const playBox = await playBtn.boundingBox()
    const nextBox = await nextBtn.boundingBox()

    // Control-group bounding box = union of the three buttons.
    const controlGroup = {
      x: Math.min(prevBox.x, playBox.x, nextBox.x),
      y: Math.min(prevBox.y, playBox.y, nextBox.y),
      width:
        Math.max(prevBox.x + prevBox.width, playBox.x + playBox.width, nextBox.x + nextBox.width) -
        Math.min(prevBox.x, playBox.x, nextBox.x),
      height:
        Math.max(prevBox.y + prevBox.height, playBox.y + playBox.height, nextBox.y + nextBox.height) -
        Math.min(prevBox.y, playBox.y, nextBox.y),
    }

    const gap = rectsGap(ctaBox, controlGroup)
    const overlap = intersects(ctaBox, controlGroup)

    // Hero container bounds — CTA must be fully inside it.
    const heroSection = page.locator('section').filter({ has: page.locator('a', { hasText: 'Find us at Rogers Centre' }) }).first()
    const heroBox = await heroSection.boundingBox()
    const ctaInsideHero =
      ctaBox.x >= heroBox.x - 0.5 &&
      ctaBox.y >= heroBox.y - 0.5 &&
      ctaBox.x + ctaBox.width <= heroBox.x + heroBox.width + 0.5 &&
      ctaBox.y + ctaBox.height <= heroBox.y + heroBox.height + 0.5

    // Tap target sizes for each control button.
    const tapSizes = {
      prev: { w: prevBox.width, h: prevBox.height },
      play: { w: playBox.width, h: playBox.height },
      next: { w: nextBox.width, h: nextBox.height },
    }
    const tapOk = Object.values(tapSizes).every((s) => s.w >= 44 && s.h >= 44)

    const shotPath = path.join(SCREENSHOT_DIR, `${vp.name}.png`)
    await page.screenshot({ path: shotPath })

    // Contrast measurement: CTA text color vs underlying background pixel
    // (sampled just behind/around the CTA text, since the CTA sits over a
    // photographic image — not a flat color — so we report the ratio
    // against the average sampled background luminance).
    const contrast = await page.evaluate(async ({ ctaBox }) => {
      function relLuminance([r, g, b]) {
        const [rs, gs, bs] = [r, g, b].map((c) => {
          const s = c / 255
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
      }
      const link = [...document.querySelectorAll('a')].find((a) => a.textContent.includes('Find us at Rogers Centre'))
      const cs = getComputedStyle(link)
      const colorMatch = cs.color.match(/\d+(\.\d+)?/g).map(Number)
      const textLum = relLuminance(colorMatch)

      // Sample background pixels via a canvas snapshot of the hero image
      // element behind the CTA (drawImage + getImageData), averaged over
      // the CTA's own bounding box region.
      const heroImg = document.querySelector('section img') || document.querySelector('section video')
      let bgLum = null
      try {
        const canvas = document.createElement('canvas')
        const rect = heroImg.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(heroImg, 0, 0, rect.width, rect.height)
        const sx = Math.max(0, Math.round(ctaBox.x - rect.x))
        const sy = Math.max(0, Math.round(ctaBox.y - rect.y))
        const sw = Math.min(Math.round(ctaBox.width), canvas.width - sx)
        const sh = Math.min(Math.round(ctaBox.height), canvas.height - sy)
        const data = ctx.getImageData(sx, sy, Math.max(sw, 1), Math.max(sh, 1)).data
        let r = 0,
          g = 0,
          b = 0,
          n = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          n++
        }
        r /= n
        g /= n
        b /= n
        bgLum = relLuminance([r, g, b])
        return { textColor: cs.color, avgBg: [r, g, b], textLum, bgLum, ratio: (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05) }
      } catch (e) {
        return { textColor: cs.color, error: String(e) }
      }
    }, { ctaBox })

    results.push({
      viewport: vp.name,
      ctaBox,
      controlGroup,
      gapPx: Math.round(gap * 100) / 100,
      overlap,
      ctaInsideHero,
      tapSizes,
      tapOk,
      contrast,
      screenshot: shotPath,
    })

    await page.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify(results, null, 2))

console.log('\n=== SUMMARY TABLE ===')
console.log('viewport'.padEnd(20), 'gap(px)'.padEnd(10), 'overlap'.padEnd(10), 'ctaInHero'.padEnd(12), 'tapOk')
for (const r of results) {
  console.log(
    r.viewport.padEnd(20),
    String(r.gapPx).padEnd(10),
    String(r.overlap).padEnd(10),
    String(r.ctaInsideHero).padEnd(12),
    String(r.tapOk)
  )
}

console.log('\n=== CONTRAST ===')
for (const r of results) {
  console.log(r.viewport, '-> ratio:', r.contrast.ratio ? r.contrast.ratio.toFixed(2) : r.contrast.error)
}
