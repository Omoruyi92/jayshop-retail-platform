const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('https://jayshop-retail-platform.vercel.app/shop', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  const btn = await page.$('button[aria-label="Sort products"]');
  if (btn) {
    await btn.evaluate((el) => el.click());
    await new Promise((r) => setTimeout(r, 500));
  }

  const result = await page.evaluate(() => {
    const listbox = document.querySelector('[role="listbox"]');
    if (!listbox) return { found: false };
    const r = listbox.getBoundingClientRect();
    const btn = document.querySelector('button[aria-label="Sort products"]')?.getBoundingClientRect();
    return {
      found: true,
      panelRect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
      buttonRect: btn ? { top: btn.top, left: btn.left, right: btn.right, bottom: btn.bottom } : null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      options: Array.from(listbox.querySelectorAll('[role="option"]')).map((o) => o.textContent?.trim()).filter(Boolean),
    };
  });

  console.log(JSON.stringify(result, null, 2));
  await page.screenshot({ path: '/Users/idehenomoruyi/projects/jays-shop/docs/out/mobile-sort-after-scroll.png' });
  await browser.close();
})();
