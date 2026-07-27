const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const outDir = '/Users/idehenomoruyi/projects/jays-shop/docs/out';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  await page.goto('https://jayshop-retail-platform.vercel.app/shop', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  const btn = await page.$('#shop-sort-mobile-button');
  if (btn) {
    await btn.click();
    await new Promise((r) => setTimeout(r, 500));
  }

  const file = `${outDir}/mobile-sort-open-390.png`;
  await page.screenshot({ path: file, fullPage: false });

  const panel = await page.evaluate(() => {
    const el = document.getElementById('shop-sort-mobile-listbox');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height, top: r.top, left: r.left, right: r.right };
  });

  console.log(JSON.stringify({ panel, file }, null, 2));
  await browser.close();
})();
