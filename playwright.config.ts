import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for promotion-alert verification.
 * Runs against the deployed storefront so no local DB is required.
 * Set BASE_URL env var to target a different deployment.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'docs/verification/promotion-alert/playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'https://jayshop-retail-platform.vercel.app',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        userAgent: devices['iPhone 13'].userAgent,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
})
