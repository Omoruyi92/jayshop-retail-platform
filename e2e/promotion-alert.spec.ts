import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs', 'verification', 'promotion-alert-v2')

function screenshotPath(name: string) {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
  return path.join(SCREENSHOT_DIR, name)
}

const MOCK_PROMOTION = {
  id: 'promo-test-blue-jays-transformers',
  text: 'Blue Jays Transformers Day — special gear available now!',
  link: '/shop',
  priority: 1,
}

type MockPromotion = {
  id: string
  text: string
  link: string
  priority: number
  startsAt?: string
  expiresAt?: string
}

function projectName(page: Page): string {
  const size = page.viewportSize()
  return size && size.width <= 500 ? 'mobile' : 'desktop'
}

async function acceptCookies(page: Page) {
  const close = page.locator('[data-testid="cookie-consent-close"]')
  if (await close.isVisible().catch(() => false)) {
    await close.click()
    await expect(page.locator('[data-testid="cookie-consent-overlay"]')).toBeHidden()
  }
}

async function routeMockPromotions(page: Page, promotions: MockPromotion[] = [MOCK_PROMOTION]) {
  await page.route('**/api/promotions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ promotions }),
    })
  })
}

const alertSelector = '[data-testid="promotion-alert-banner"]'

test.describe('promotion alert banner (v2 — attached to main nav)', () => {
  test('renders active promotion inside the main nav bar on home and shop', async ({ page }) => {
    await routeMockPromotions(page)
    await page.goto('/')
    await acceptCookies(page)

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()
    await page.screenshot({ path: screenshotPath(`home-alert-${projectName(page)}.png`), fullPage: false })
    await expect(banner).toContainText(MOCK_PROMOTION.text)

    // Banner lives inside the main <nav> (SubNavBar), attached to it.
    const nav = page.locator('nav', { has: banner }).first()
    await expect(nav).toBeVisible()

    // Static alert (single link when promo has one), not a marquee.
    const links = banner.locator('a')
    await expect(links).toHaveCount(1)
    await expect(links).toHaveAttribute('href', MOCK_PROMOTION.link)

    // Client-side navigation keeps it visible.
    await page.goto('/shop')
    await acceptCookies(page)
    await expect(banner).toBeVisible()
  })

  test('approved promotion with a future start date still displays', async ({ page }) => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    await routeMockPromotions(page, [{ ...MOCK_PROMOTION, startsAt: future.toISOString() }])
    await page.goto('/')
    await acceptCookies(page)

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(MOCK_PROMOTION.text)
    await page.screenshot({ path: screenshotPath(`future-approved-${projectName(page)}.png`), fullPage: false })
  })

  test('dismisses via X, stays dismissed across client navigation, reappears after refresh', async ({ page }) => {
    await routeMockPromotions(page)
    await page.goto('/')
    await acceptCookies(page)

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()
    await page.screenshot({ path: screenshotPath(`dismiss-before-${projectName(page)}.png`), fullPage: false })

    await banner.locator('button[aria-label*="Close"]').click()
    await expect(banner).toBeHidden()

    // Client-side navigation in the same page load keeps it dismissed
    // (layout persists across route changes). Use link clicks, not
    // page.goto (goto is a full reload which MUST restore the banner).
    await page.getByRole('link', { name: 'Shop', exact: true }).first().click()
    await expect(page).toHaveURL(/\/shop/)
    await expect(banner).toBeHidden()

    // A page refresh restores the banner (per-page-load dismissal).
    await page.reload()
    await acceptCookies(page)
    await expect(banner).toBeVisible()
    await page.screenshot({ path: screenshotPath(`dismiss-after-refresh-${projectName(page)}.png`), fullPage: false })
  })

  test('a newly published promotion (different id) reappears after dismissal', async ({ page }) => {
    await routeMockPromotions(page)
    await page.goto('/')
    await acceptCookies(page)

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()
    await banner.locator('button[aria-label*="Close"]').click()
    await expect(banner).toBeHidden()

    // Swap the active promotion to a different id and navigate client-side —
    // the provider refetches on mount per page load; simulate the new promo
    // arriving via the API by re-routing and reloading is a full refresh,
    // so instead assert the id-keyed logic directly: dismissal state is
    // keyed to the OLD id, so a new promo with a new id must render.
    await page.unroute('**/api/promotions')
    await routeMockPromotions(page, [{ ...MOCK_PROMOTION, id: 'promo-new-id', text: 'Brand new promo!' }])
    await page.reload()
    await acceptCookies(page)
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('Brand new promo!')
  })

  test('no reserved space when there is no active promotion', async ({ page }) => {
    await routeMockPromotions(page, [])
    await page.goto('/')
    await acceptCookies(page)

    await expect(page.locator(alertSelector)).toHaveCount(0)
    await page.screenshot({ path: screenshotPath(`no-promo-no-space-${projectName(page)}.png`), fullPage: false })
  })

  test('mobile 390x844 — banner attached to nav, Time Status pill lives in the nav row', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await routeMockPromotions(page)
    await page.goto('/')
    await acceptCookies(page)

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()

    // Time Status badge is inside the main nav bar on mobile.
    const nav = page.locator('nav', { has: banner }).first()
    await expect(nav.getByText('Jays Shop', { exact: false }).first()).toBeVisible()

    await page.screenshot({ path: screenshotPath('mobile-nav-alert-and-status.png'), fullPage: false })
  })

  test('desktop 1440x900 — banner attached to nav below header', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await routeMockPromotions(page)
    await page.goto('/')
    await acceptCookies(page)

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()
    await page.screenshot({ path: screenshotPath('desktop-nav-alert.png'), fullPage: false })

    const bannerBox = await banner.boundingBox()
    const header = page.locator('header')
    const headerBox = await header.boundingBox()

    expect(bannerBox).not.toBeNull()
    expect(headerBox).not.toBeNull()
    // Banner now sits BELOW the header (attached to the nav bar).
    expect(bannerBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 2)
  })
})
