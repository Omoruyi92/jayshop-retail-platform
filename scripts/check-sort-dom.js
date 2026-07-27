const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('https://jayshop-retail-platform.vercel.app/shop', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  const info = await page.evaluate(() => {
    const html = document.body.innerHTML;
    return {
      hasSortButton: html.includes('Sort products'),
      hasListbox: html.includes('role="listbox"'),
      hasOptions: html.includes('Standard Catalog Arrangement'),
      sortButtonCount: document.querySelectorAll('button[aria-label="Sort products"]').length,
      listboxCount: document.querySelectorAll('[role="listbox"]').length,
    };
  });
  console.log(info);
  await browser.close();
})();
