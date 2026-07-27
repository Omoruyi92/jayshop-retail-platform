const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('https://jayshop-retail-platform.vercel.app/shop', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));

  const btn = await page.$('button[aria-label="Sort products"]');
  if (!btn) {
    console.log('Sort button not found');
    await browser.close();
    return;
  }

  await btn.evaluate((el) => el.click());
  await new Promise((r) => setTimeout(r, 1000));

  const info = await page.evaluate(() => {
    const listbox = document.querySelector('[role="listbox"]');
    return {
      listboxFound: !!listbox,
      listboxHTML: listbox ? listbox.outerHTML.slice(0, 500) : null,
      listboxCount: document.querySelectorAll('[role="listbox"]').length,
      optionCount: document.querySelectorAll('[role="option"]').length,
    };
  });
  console.log(info);

  await page.screenshot({ path: '/Users/idehenomoruyi/projects/jays-shop/docs/out/mobile-sort-debug.png' });
  await browser.close();
})();
