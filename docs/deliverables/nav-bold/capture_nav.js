const puppeteer = require('puppeteer');
const path = require('path');

const URL = process.argv[2] || 'http://localhost:3001';
const OUT_PREFIX = process.argv[3] || 'local';
const OUT_DIR = path.join(__dirname);

async function shoot(browser, viewport, name) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  console.log('Saved', file);
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  await shoot(browser, { width: 1280, height: 900 }, `${OUT_PREFIX}-desktop-1280`);
  await shoot(browser, { width: 375, height: 812 }, `${OUT_PREFIX}-mobile-375`);
  await browser.close();
})();
