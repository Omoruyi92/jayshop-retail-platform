const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const outDir = '/Users/idehenomoruyi/projects/jays-shop/docs/out';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const base = process.env.JAYSHOP_URL || 'https://jayshop.ca';
  const pages = [
    { path: '/', name: 'home' },
    { path: '/shop', name: 'shop' },
    { path: '/shop-by-style', name: 'shop-by-style' },
    { path: '/players', name: 'players' },
    { path: '/gallery', name: 'gallery' },
  ];

  const results = [];

  for (const { path, name } of pages) {
    const url = base + path;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise((r) => setTimeout(r, 2000));

      const rect = await page.evaluate(() => {
        const section = document.querySelector('section.relative');
        if (!section) return null;
        const r = section.getBoundingClientRect();
        return { height: Math.round(r.height), top: Math.round(r.top) };
      });

      const file = `${outDir}/hero-${name}-1280.png`;
      await page.screenshot({ path: file, fullPage: false });
      results.push({ name, url, rect, file });
      console.log(JSON.stringify({ name, url, rect, file }));
    } catch (err) {
      results.push({ name, url, error: err.message });
      console.error(JSON.stringify({ name, url, error: err.message }));
    }
  }

  fs.writeFileSync(`${outDir}/hero-heights-1280.json`, JSON.stringify(results, null, 2));
  await browser.close();
})();
