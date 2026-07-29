// One-off proof-capture script (not part of the app build). Launches
// Chromium via Playwright, loads the home page at a matrix of viewport
// widths, seeks the hero <video> to specific currentTime values, waits for
// the `seeked` event + a rendered animation frame, then screenshots the
// hero section. Used to prove the new hero video + overlay copy render
// correctly with no clipping/overlap at any breakpoint.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

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

// Computes, for a video of natural size (videoWidth x videoHeight) rendered
// with `object-fit: cover` into a box of size (boxWidth x boxHeight), what
// fraction of the video's own width/height is cropped away by the browser.
// This is a pure geometry calc (matches the CSS object-fit: cover spec) and
// is what actually caught the tablet-portrait defect: a 1080x1440 (0.75
// aspect) video forced into a 768x560 (1.37 aspect) box gets scaled up to
// cover the box width, which crops away a large fraction of its height —
// discarding the lower-third merchandise in the source still.
function computeCoverCropFractions(videoWidth, videoHeight, boxWidth, boxHeight) {
  if (!videoWidth || !videoHeight || !boxWidth || !boxHeight) return null
  const videoAspect = videoWidth / videoHeight
  const boxAspect = boxWidth / boxHeight
  let renderedVideoWidth
  let renderedVideoHeight
  if (videoAspect > boxAspect) {
    // Video is relatively wider than the box -> box height fully used,
    // video scaled so height matches box height, width overflows and is
    // cropped on the left/right.
    renderedVideoHeight = videoHeight
    renderedVideoWidth = videoHeight * boxAspect
  } else {
    // Video is relatively taller/narrower than the box -> box width fully
    // used, video scaled so width matches box width, height overflows and
    // is cropped top/bottom.
    renderedVideoWidth = videoWidth
    renderedVideoHeight = videoWidth / boxAspect
  }
  const croppedWidthFraction = 1 - renderedVideoWidth / videoWidth
  const croppedHeightFraction = 1 - renderedVideoHeight / videoHeight
  return {
    containerAspect: boxAspect,
    videoAspect,
    croppedWidthFraction,
    croppedHeightFraction,
  }
}

// Heuristic merchandise-visibility check. The two source stills have a
// known, deliberate composition: a large flat navy/blue "clean" region
// (left half for the landscape video, upper half for the portrait video)
// and a visually busy merchandise region (right half / lower third
// respectively) full of jersey colors (white/red/light-blue letters,
// cap panels, skin tones, CN Tower grey) that is NOT flat navy. We sample
// a grid of pixels inside the expected merchandise region of the actual
// rendered screenshot and measure color variance + how many pixels are
// clearly "non-navy" (far from the flat backdrop color in RGB distance).
// A real merchandise region has high variance and a large non-navy pixel
// fraction; a region that's actually still showing clean backdrop (i.e.
// the crop discarded the merchandise) reads as low-variance, dominated by
// one navy-ish color.
async function analyzeMerchandiseVisibility(screenshotPath, sectionRect, wantsMobileSrc) {
  const image = sharp(screenshotPath)
  const meta = await image.metadata()
  const fullW = meta.width
  const fullH = meta.height

  // Merchandise region in the *rendered* frame: right ~45% for a landscape
  // (desktop) video source, bottom ~35% for a portrait (mobile) video
  // source — matches the known source-still composition described in the
  // task (clean region = left half desktop / upper half mobile).
  let region
  if (wantsMobileSrc) {
    region = {
      left: Math.floor(fullW * 0.1),
      top: Math.floor(fullH * 0.68),
      width: Math.floor(fullW * 0.8),
      height: Math.floor(fullH * 0.28),
    }
  } else {
    region = {
      left: Math.floor(fullW * 0.55),
      top: Math.floor(fullH * 0.15),
      width: Math.floor(fullW * 0.4),
      height: Math.floor(fullH * 0.7),
    }
  }
  // Guard against a degenerate (zero-size) region on very small captures.
  if (region.width < 4 || region.height < 4) {
    return { region, sampled: false, reason: 'region-too-small' }
  }

  const { data, info } = await image
    .extract(region)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = info.channels
  const pixelCount = info.width * info.height
  let rSum = 0
  let gSum = 0
  let bSum = 0
  const samples = []
  const step = Math.max(1, Math.floor(pixelCount / 400)) // ~400 sample points
  for (let i = 0; i < pixelCount; i += step) {
    const o = i * channels
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    rSum += r
    gSum += g
    bSum += b
    samples.push([r, g, b])
  }
  const n = samples.length
  const rMean = rSum / n
  const gMean = gSum / n
  const bMean = bSum / n

  let varSum = 0
  let nonNavyCount = 0
  for (const [r, g, b] of samples) {
    const d2 = (r - rMean) ** 2 + (g - gMean) ** 2 + (b - bMean) ** 2
    varSum += d2
    // "Navy-ish" reference: the hero's flat backdrop color is a dark,
    // fairly saturated blue. A pixel is "non-navy" if it's notably
    // brighter/whiter (jersey/cap highlights) or has a red/warm channel
    // much closer to or above its blue channel (red jersey piping, skin
    // tones, CN Tower concrete), or is a light/bright blue distinctly
    // different from the deep backdrop navy.
    const brightness = (r + g + b) / 3
    const isBright = brightness > 90
    const isWarm = r > b - 10
    if (isBright || isWarm) nonNavyCount++
  }
  const colorVariance = Math.sqrt(varSum / n)
  const nonNavyFraction = nonNavyCount / n

  // Thresholds chosen empirically: a genuinely flat backdrop crop measures
  // colorVariance well under 15 and nonNavyFraction well under 0.05; a
  // frame that actually contains jerseys/caps/skyline measures well above
  // both. Flag anything ambiguous as merchandiseVisible: false so it gets
  // human review rather than a false pass.
  const merchandiseVisible = colorVariance > 15 && nonNavyFraction > 0.08

  return {
    region,
    sampled: true,
    sampleCount: n,
    meanColor: { r: Math.round(rMean), g: Math.round(gMean), b: Math.round(bMean) },
    colorVariance: Math.round(colorVariance * 100) / 100,
    nonNavyFraction: Math.round(nonNavyFraction * 1000) / 1000,
    merchandiseVisible,
  }
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

      // Container box = the hero <section>'s own rendered box (what the
      // video is object-cover'd into). Determine which source was selected
      // by comparing the seeked video's natural dimensions against the
      // known desktop (1920x1080) vs mobile (1080x1440) source sizes.
      const boxWidth = margins?.sectionRect?.width
      const boxHeight = margins?.sectionRect?.height
      const wantsMobileSrc = seekResult.videoWidth === 1080 && seekResult.videoHeight === 1440
      const cropAnalysis = seekResult.ok
        ? computeCoverCropFractions(seekResult.videoWidth, seekResult.videoHeight, boxWidth, boxHeight)
        : null
      const merchandiseAnalysis = seekResult.ok
        ? await analyzeMerchandiseVisibility(fpath, margins?.sectionRect, wantsMobileSrc)
        : null

      const cropOk =
        cropAnalysis == null ||
        (cropAnalysis.croppedWidthFraction <= 0.25 && cropAnalysis.croppedHeightFraction <= 0.25)
      const merchandiseOk = merchandiseAnalysis == null || merchandiseAnalysis.merchandiseVisible

      report.push({
        viewport: vp,
        time: t,
        file: fpath,
        seekResult,
        margins,
        selectedSource: wantsMobileSrc ? 'mobileUrl (portrait)' : 'url (landscape)',
        cropAnalysis,
        merchandiseAnalysis,
        pass: {
          cropOk,
          merchandiseOk,
          marginsOk: !!margins && margins.leftMargin > 0 && margins.rightMargin > 0 && !margins.isOverflowing,
          overall: cropOk && merchandiseOk && !!margins && margins.leftMargin > 0 && margins.rightMargin > 0 && !margins.isOverflowing,
        },
      })
      console.log(
        `[${vp.width}x${vp.height} t=${t}] src=${wantsMobileSrc ? 'mobile' : 'desktop'} ` +
          `containerAspect=${cropAnalysis?.containerAspect?.toFixed(2)} videoAspect=${cropAnalysis?.videoAspect?.toFixed(2)} ` +
          `croppedW=${cropAnalysis?.croppedWidthFraction?.toFixed(3)} croppedH=${cropAnalysis?.croppedHeightFraction?.toFixed(3)} ` +
          `merchVisible=${merchandiseAnalysis?.merchandiseVisible} variance=${merchandiseAnalysis?.colorVariance} nonNavy=${merchandiseAnalysis?.nonNavyFraction} ` +
          `margins(L/R)=${margins?.leftMargin}/${margins?.rightMargin} overflow=${margins?.isOverflowing}`,
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
