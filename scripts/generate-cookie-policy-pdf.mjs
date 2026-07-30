/* Build-once script: renders a branded Cookie Policy HTML to a static PDF at
   public/docs/jays-shop-cookie-policy.pdf using Playwright Chromium.
   Re-run manually if COOKIE_POLICY_ITEMS in
   src/components/policies/CookiePolicyContent.tsx changes.
   Run: node scripts/generate-cookie-policy-pdf.mjs */
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Extract COOKIE_POLICY_ITEMS from the shared component (single source of truth).
const src = readFileSync(join(root, 'src/components/policies/CookiePolicyContent.tsx'), 'utf8')
const match = src.match(/export const COOKIE_POLICY_ITEMS = \[([\s\S]*?)\n\]/)
if (!match) throw new Error('COOKIE_POLICY_ITEMS not found')
const items = [...match[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'"))
if (items.length < 5) throw new Error(`Only parsed ${items.length} items`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; }
  .header { background: linear-gradient(135deg, #134A8E, #1a4480, #1D2D5C); color: #fff; padding: 36px 44px; }
  .header h1 { font-size: 26px; text-transform: uppercase; letter-spacing: 2px; }
  .header .sub { color: rgba(191, 219, 254, 0.85); font-size: 12px; margin-top: 8px; }
  .header .brand { font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: rgba(191, 219, 254, 0.7); margin-bottom: 10px; }
  .content { padding: 32px 44px; }
  ul { list-style: none; }
  li { display: flex; gap: 10px; font-size: 12.5px; line-height: 1.7; margin-bottom: 14px; }
  li::before { content: '\\2022'; color: #134A8E; font-weight: bold; }
  .footer { padding: 0 44px 32px; font-size: 10px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; margin: 16px 44px 0; padding-left: 0; padding-right: 0; }
</style></head><body>
  <div class="header">
    <div class="brand">Jays Shop &bull; Rogers Centre &bull; Toronto</div>
    <h1>Cookie Policy</h1>
    <div class="sub">How we use cookies and similar technologies on our website.</div>
  </div>
  <div class="content"><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></div>
  <div class="footer">Last updated: July 2026 &mdash; Jays Shop, Gate 5, Rogers Centre, Toronto &bull; 416.341.2904 &bull; jayshop-retail-platform.vercel.app/cookie-policy</div>
</body></html>`

mkdirSync(join(root, 'public/docs'), { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.pdf({
  path: join(root, 'public/docs/jays-shop-cookie-policy.pdf'),
  format: 'Letter',
  printBackground: true,
})
await browser.close()
console.log('PDF written to public/docs/jays-shop-cookie-policy.pdf')
