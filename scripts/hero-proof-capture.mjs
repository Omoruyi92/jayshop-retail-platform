// One-off proof-capture script (not part of the app build). Launches
// Chromium via Playwright, loads the home page at a matrix of viewport
// widths, seeks the hero <video> to specific currentTime values, waits for
// the `seeked` event + a rendered animation frame, then screenshots the
// hero section. Used to prove the new hero video + overlay copy render
// correctly with no clipping/overlap at any breakpoint.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE_URL = process.env.HERO_PROOF_URL || 'http://localhost:3001'
const OUT_DIR = '/Users/idehenomoruyi/projects/jays-shop/docs/hero-proof'

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 393, height: 852 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
]

const TIMES = [0, 4.0]

async function seekAndWait(page, t) {
  const result = await page.evaluate(async (time) => {
    const video = document.querySelector('section video')
    if (!video) return { ok: false, reason: 'no-video-element' }

    // Make sure we actually have enough data to seek/paint a real frame.
    await new Promise((resolve) => {
      if (video.readyState >= 2) return resolve(undefined)
      const onReady = () => {
        video.removeEventListener('loadeddata', onReady)
        resolve(undefined)
      }
      video.addEventListener('loadeddata', onReady)
      setTimeout(resolve, 4000)
    })

    await new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked)
        resolve(undefined)
      }
      video.addEventListener('seeked', onSeeked)
      video.currentTime = time
      setTimeout(resolve, 4000)
    })

    // Wait two animation frames so the seeked frame has actually been
    // composited/painted before we screenshot.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    return {
      ok: true,
      currentTime: video.currentTime,
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      paused: video.paused,
    }
  }, t)
  return result
}

async function measureMargins(page) {
  return page.evaluate(() => {
    const section = document.querySelector('section')
    const h1 = document.querySelector('section h1')
    if (!section || !h1) return null
    const sRect = section.getBoundingClientRect()
    const tRect = h1.getBoundingClientRect()
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      sectionRect: { x: sRect.x, y: sRect.y, width: sRect.width, height: sRect.height },
      textRect: { x: tRect.x, y: tRect.y, width: tRect.width, height: tRect.height },
      leftMargin: tRect.left,
      rightMargin: window.innerWidth - tRect.right,
      headlineText: h1.textContent,
      scrollWidth: h1.scrollWidth,
      clientWidth: h1.clientWidth,
      isOverflowing: h1.scrollWidth > h1.clientWidth + 1,
    }
  })
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const report = []

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: vp })
    const page = await context.newPage()
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })

    // Let the hero video element mount and start loading.
    await page.waitForSelector('section video', { timeout: 15000 }).catch(() => {})

    for (const t of TIMES) {
      const seekResult = await seekAndWait(page, t)
      const margins = await measureMargins(page)
      const fname = `hero_${vp.width}x${vp.height}_t${t.toFixed(1)}.png`
      const fpath = path.join(OUT_DIR, fname)
      const heroSection = page.locator('section').first()
      await heroSection.screenshot({ path: fpath })

      report.push({
        viewport: vp,
        time: t,
        file: fpath,
        seekResult,
        margins,
      })
      console.log(
        `[${vp.width}x${vp.height} t=${t}] seek=${JSON.stringify(seekResult)} margins=${JSON.stringify(margins)}`,
      )
    }

    await context.close()
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
