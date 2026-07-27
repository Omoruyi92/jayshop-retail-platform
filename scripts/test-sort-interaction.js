const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('https://jayshop-retail-platform.vercel.app/shop', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  const btn = await page.$('button[aria-label="Sort products"]');
  if (!btn) {
    console.log('Sort button not found');
    await browser.close();
    return;
  }
  await btn.evaluate((el) => el.click());
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: '/Users/idehenomoruyi/projects/jays-shop/docs/out/mobile-sort-open-v2-390.png' });

  await page.evaluate(() => {
    const opts = document.querySelectorAll('[role="option"]');
    opts.forEach((o) => { if (o.textContent?.includes('Price: Low to High')) o.click(); });
  });
  await new Promise((r) => setTimeout(r, 500));
  const label = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Sort products"]');
    return btn?.textContent?.trim();
  });
  console.log('selected label:', label);

  await browser.close();
})();
