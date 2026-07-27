const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  for (const viewport of [
    { width: 390, height: 844, name: 'mobile' },
    { width: 1280, height: 800, name: 'desktop' },
  ]) {
    await page.setViewport(viewport);
    await page.goto('https://jayshop-retail-platform.vercel.app/shop', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));

    const btn = await page.$('button[aria-label="Sort products"]');
    if (btn) {
      await btn.evaluate((el) => el.click());
      await new Promise((r) => setTimeout(r, 500));
    }

    const result = await page.evaluate(() => {
      const el = document.querySelector('[role="listbox"]');
      if (!el) return { found: false };
      const r = el.getBoundingClientRect();
      return {
        found: true,
        rect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
        viewport: { width: window.innerWidth, height: window.innerHeight },
        fullyVisible: r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight,
        options: Array.from(el.querySelectorAll('[role="option"]')).map((o) => o.textContent?.trim()).filter(Boolean),
      };
    });

    console.log(viewport.name, JSON.stringify(result, null, 2));
  }

  await browser.close();
})();
