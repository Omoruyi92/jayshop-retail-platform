// Puppeteer screenshot capture for Jays Shop Platform User Manual
// Logs into the live production admin panel and captures real screenshots
// of each major screen/workflow for the manual.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://jayshop-retail-platform.vercel.app';
const OUT_DIR = path.join(__dirname, 'deliverables', 'screenshots');
const EMAIL = 'admin@jays.shop';
const PASSWORD = 'BlueJays2026&';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function safeShot(page, name, opts = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  try {
    await page.screenshot({ path: file, fullPage: opts.fullPage !== false });
    console.log('OK  ', name);
    return true;
  } catch (e) {
    console.log('FAIL', name, e.message);
    return false;
  }
}

async function gotoSafe(page, url, name) {
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await delay(1200);
    return true;
  } catch (e) {
    console.log('NAV-FAIL', name, url, e.message);
    return false;
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = {};

  // ---------- Login ----------
  await gotoSafe(page, `${BASE_URL}/admin/login`, 'login-page');
  results['01-admin-login'] = await safeShot(page, '01-admin-login');

  let loginOk = false;
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', EMAIL, { delay: 20 });
    await page.type('input[type="password"]', PASSWORD, { delay: 20 });
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    ]);
    await delay(1500);
    const url = page.url();
    loginOk = url.includes('/admin') && !url.includes('/admin/login');
    console.log('LOGIN URL AFTER SUBMIT:', url, 'loginOk=', loginOk);
  } catch (e) {
    console.log('LOGIN-ERROR', e.message);
  }

  if (!loginOk) {
    console.log('LOGIN FAILED - aborting admin capture');
    await browser.close();
    process.exit(1);
  }

  // Confirm logged in
  await gotoSafe(page, `${BASE_URL}/admin`, 'dashboard');
  results['02-admin-dashboard'] = await safeShot(page, '02-admin-dashboard');

  const pages = [
    ['03-admin-products', '/admin/products'],
    ['04-admin-holds', '/admin/holds'],
    ['05-admin-hold-settings', '/admin/hold-settings'],
    ['06-admin-inventory-history', '/admin/inventory/history'],
    ['07-admin-game-days', '/admin/game-days'],
    ['08-admin-promotions', '/admin/promotions'],
    ['09-admin-analytics', '/admin/analytics'],
    ['10-admin-reports', '/admin/reports'],
    ['11-admin-history', '/admin/history'],
    ['12-admin-categories', '/admin/categories'],
    ['13-admin-brands', '/admin/brands'],
    ['14-admin-settings', '/admin/settings'],
    ['15-admin-admins', '/admin/admins'],
    ['16-admin-audit-log', '/admin/audit-log'],
    ['17-admin-pos-keys', '/admin/pos-keys'],
    ['18-admin-pos-events', '/admin/pos-events'],
    ['19-admin-players', '/admin/players'],
    ['20-admin-styles', '/admin/styles'],
    ['21-admin-gallery', '/admin/gallery'],
    ['22-admin-hero-media', '/admin/hero-media'],
    ['23-admin-reviews', '/admin/reviews'],
    ['24-admin-notifications', '/admin/notifications'],
  ];

  for (const [name, route] of pages) {
    const ok = await gotoSafe(page, `${BASE_URL}${route}`, name);
    if (ok) results[name] = await safeShot(page, name);
  }

  // ---------- Product Locations / Edit modal on Products page ----------
  try {
    await gotoSafe(page, `${BASE_URL}/admin/products`, 'products-for-modal');
    await delay(1500);
    const editClicked = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, a'));
      const editBtn = candidates.find((el) =>
        /edit/i.test(el.getAttribute('aria-label') || '') ||
        /edit/i.test(el.textContent || '')
      );
      if (editBtn) { editBtn.click(); return true; }
      return false;
    });
    if (editClicked) {
      await delay(1500);
      results['25-product-edit-modal'] = await safeShot(page, '25-product-edit-modal', { fullPage: false });
      await page.keyboard.press('Escape').catch(() => {});
      await delay(500);
    }
  } catch (e) {
    console.log('MODAL-ERROR products', e.message);
  }

  // ---------- Holds page - look for resolve/release actions ----------
  try {
    await gotoSafe(page, `${BASE_URL}/admin/holds`, 'holds-detail');
    await delay(1500);
    results['26-admin-holds-detail'] = await safeShot(page, '26-admin-holds-detail');
  } catch (e) {}

  // ---------- Storefront: home, shop, PDP, cart, hold receipt ----------
  const storefrontPages = [
    ['27-storefront-home', '/'],
    ['28-storefront-shop', '/shop'],
    ['29-storefront-my-holds', '/my-holds'],
  ];
  for (const [name, route] of storefrontPages) {
    const ok = await gotoSafe(page, `${BASE_URL}${route}`, name);
    if (ok) results[name] = await safeShot(page, name);
  }

  // Try to open a product detail page from shop grid
  try {
    await gotoSafe(page, `${BASE_URL}/shop`, 'shop-for-pdp');
    await delay(1500);
    const href = await page.evaluate(() => {
      const link = document.querySelector('a[href^="/shop/"]');
      return link ? link.getAttribute('href') : null;
    });
    if (href) {
      await gotoSafe(page, `${BASE_URL}${href}`, 'product-detail');
      results['30-storefront-product-detail'] = await safeShot(page, '30-storefront-product-detail');
    }
  } catch (e) {
    console.log('PDP-ERROR', e.message);
  }

  await browser.close();

  console.log('\n--- SUMMARY ---');
  const okCount = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  console.log(`Captured ${okCount}/${total} screenshots`);
  fs.writeFileSync(path.join(OUT_DIR, '_manifest.json'), JSON.stringify(results, null, 2));
})();
