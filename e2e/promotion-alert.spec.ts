import { test, expect, type Page } from '@playwright/test'

const MOCK_PROMOTION = {
  id: 'promo-test-blue-jays-transformers',
  text: 'Blue Jays Transformers Day — special gear available now!',
  link: '/shop',
  priority: 1,
}

async function routeMockPromotions(page: Page) {
  await page.route('/api/promotions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ promotions: [MOCK_PROMOTION] }),
    })
  })
}

const alertSelector = '[data-testid="promotion-alert-banner"]'

test.describe('promotion alert banner', () => {
  test('renders active approved promotion as a static alert banner on home and shop', async ({ page }) => {
    await routeMockPromotions(page)
    await page.goto('/')

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(MOCK_PROMOTION.text)

    // It should be a static alert, not a marquee / scrolling duplicated set.
    const links = banner.locator('a')
    await expect(links).toHaveCount(1)
    await expect(links).toHaveAttribute('href', MOCK_PROMOTION.link)

    // Navigate to shop — banner should still be visible in the same session.
    await page.goto('/shop')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(MOCK_PROMOTION.text)
  })

  test('dismisses via X and stays hidden while navigating, reappears in a fresh session', async ({ page, context }) => {
    await routeMockPromotions(page)
    await page.goto('/')

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()

    await banner.locator('button[aria-label*="Close"]').click()
    await expect(banner).toBeHidden()

    // Same tab / context navigation keeps it dismissed.
    await page.goto('/shop')
    await expect(banner).toBeHidden()

    // A fresh browser context should see the banner again.
    const newPage = await context.browser().newPage()
    await routeMockPromotions(newPage)
    await newPage.goto('/')
    await expect(newPage.locator(alertSelector)).toBeVisible()
    await newPage.close()
  })

  test('mobile 390x844 banner sits above header and does not overlap status pill', async ({ page }) => {
    await routeMockPromotions(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()

    const bannerBox = await banner.boundingBox()
    const header = page.locator('header')
    const headerBox = await header.boundingBox()

    expect(bannerBox).not.toBeNull()
    expect(headerBox).not.toBeNull()
    expect(bannerBox!.y + bannerBox!.height).toBeLessThanOrEqual(headerBox!.y + 2)
  })

  test('desktop 1440x900 banner sits above header', async ({ page }) => {
    await routeMockPromotions(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const banner = page.locator(alertSelector)
    await expect(banner).toBeVisible()

    const bannerBox = await banner.boundingBox()
    const header = page.locator('header')
    const headerBox = await header.boundingBox()

    expect(bannerBox).not.toBeNull()
    expect(headerBox).not.toBeNull()
    expect(bannerBox!.y + bannerBox!.height).toBeLessThanOrEqual(headerBox!.y + 2)
  })
})
