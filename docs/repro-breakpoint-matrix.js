const puppeteer = require('puppeteer');
const { KnownDevices } = puppeteer;

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/matrix';

// Breakpoint matrix: use KnownDevices where a close match exists, else raw viewport.
const MATRIX = [
  { name: '320-iphoneSE1', width: 320, height: 568, device: null },
  { name: '360-galaxyS8', width: 360, height: 740, device: 'Galaxy S8' },
  { name: '375-iphoneSE2', width: 375, height: 667, device: 'iPhone SE' },
  { name: '375-iphone12mini', width: 375, height: 812, device: 'iPhone 12 Mini' },
  { name: '390-iphone12', width: 390, height: 844, device: 'iPhone 12' },
  { name: '393-pixel5', width: 393, height: 851, device: 'Pixel 5' },
  { name: '412-pixel7', width: 412, height: 915, device: null },
  { name: '414-iphone11pro', width: 414, height: 896, device: 'iPhone 11 Pro Max' },
  { name: '414-iphone6-8plus', width: 414, height: 736, device: null },
  { name: '428-iphone12promax', width: 428, height: 926, device: 'iPhone 12 Pro Max' },
  { name: '430-iphone15promax', width: 430, height: 932, device: null },
  { name: '640-sm-boundary', width: 640, height: 900, device: null },
  { name: '768-md-ipad-portrait', width: 768, height: 1024, device: 'iPad Mini' },
];

const results = [];

function log(row) {
  results.push(row);
  console.log(JSON.stringify(row));
}

async function measurePage(page, vw) {
  return page.evaluate((vw) => {
    const docWidth = document.documentElement.scrollWidth;
    return { docScrollWidth: docWidth, innerWidth: vw, pageOverflow: docWidth > vw };
  }, vw);
}

async function rectOf(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  }, selector);
}

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const fs = require('fs');
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  for (const vp of MATRIX) {
    const page = await browser.newPage();
    if (vp.device && KnownDevices[vp.device]) {
      await page.emulate(KnownDevices[vp.device]);
      // Override viewport width/height to match our target exactly, keep device's UA/touch flags
      await page.setViewport({ ...KnownDevices[vp.device].viewport, width: vp.width, height: vp.height });
    } else {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.width < 768, hasTouch: vp.width < 768 });
    }

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 1200));

    const isDesktopNav = vp.width >= 768; // md breakpoint: desktop nav visible, hamburger hidden

    // --- 1. CLOSED STATE ---
    const closedOverflow = await measurePage(page, vp.width);
    const bellRect = await rectOf(page, 'button[aria-label^="Notifications"]');
    const heartRect = await rectOf(page, 'button[aria-label^="Favorites"]');
    const cartRect = await rectOf(page, 'button[aria-label^="Cart"]');
    const langRect = await rectOf(page, 'button[aria-label="Select language"]');
    const hamburgerRect = await rectOf(page, 'button[aria-label="Open menu"]');
    const weCareTriggerRect = await rectOf(page, 'button[aria-label="We Care values"]');

    const checkClip = (r) => (r ? (r.right > vp.width + 0.5 || r.left < -0.5) : null);

    log({
      phase: 'closed', width: vp.name, vw: vp.width,
      pageOverflow: closedOverflow.pageOverflow, scrollWidth: closedOverflow.docScrollWidth,
      bellClipped: checkClip(bellRect), heartClipped: checkClip(heartRect), cartClipped: checkClip(cartRect),
      langClipped: checkClip(langRect), hamburgerClipped: checkClip(hamburgerRect),
      hamburgerVisible: !isDesktopNav ? !!hamburgerRect : 'n/a(desktop)',
      weCareTriggerClipped: isDesktopNav ? checkClip(weCareTriggerRect) : 'n/a(mobile)',
    });

    await page.screenshot({ path: `${SCREENSHOT_DIR}/${vp.name}-1-closed.png` });

    // --- 2. LANGUAGE SELECTOR OPEN ---
    if (langRect) {
      await page.evaluate(() => document.querySelector('button[aria-label="Select language"]').click());
      await new Promise((r) => setTimeout(r, 350));
      const langOverflow = await measurePage(page, vp.width);
      const langPanelRect = await rectOf(page, 'div[role="listbox"]');
      log({
        phase: 'lang-open', width: vp.name, vw: vp.width,
        pageOverflow: langOverflow.pageOverflow, scrollWidth: langOverflow.docScrollWidth,
        panelClipped: checkClip(langPanelRect), panelRect: langPanelRect,
      });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${vp.name}-2-lang-open.png` });
      // close it
      await page.evaluate(() => document.querySelector('button[aria-label="Select language"]').click());
      await new Promise((r) => setTimeout(r, 250));
    }

    // --- 3a. DESKTOP We Care popover (md+ only) ---
    if (isDesktopNav && weCareTriggerRect) {
      await page.evaluate(() => document.querySelector('button[aria-label="We Care values"]').click());
      await new Promise((r) => setTimeout(r, 350));
      const wcOverflow = await measurePage(page, vp.width);
      const wcPanelRect = await page.evaluate((vw) => {
        const panel = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Our Values') && d.textContent.includes('Welcoming') && d.className.includes('fixed'));
        if (!panel) return null;
        const r = panel.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }, vp.width);
      log({
        phase: 'wecare-desktop-open', width: vp.name, vw: vp.width,
        pageOverflow: wcOverflow.pageOverflow, scrollWidth: wcOverflow.docScrollWidth,
        panelClipped: checkClip(wcPanelRect), panelRect: wcPanelRect,
      });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${vp.name}-3-wecare-desktop.png` });
      await page.evaluate(() => document.querySelector('button[aria-label="We Care values"]').click());
      await new Promise((r) => setTimeout(r, 250));
    }

    // --- 3b. MOBILE hamburger menu open (below md only) ---
    if (!isDesktopNav && hamburgerRect) {
      await page.evaluate(() => document.querySelector('button[aria-label="Open menu"]').click());
      await new Promise((r) => setTimeout(r, 400));
      const menuOverflow = await measurePage(page, vp.width);
      const menuPanelRect = await rectOf(page, 'div.fixed.w-64');
      log({
        phase: 'mobile-menu-open', width: vp.name, vw: vp.width,
        pageOverflow: menuOverflow.pageOverflow, scrollWidth: menuOverflow.docScrollWidth,
        panelClipped: checkClip(menuPanelRect), panelRect: menuPanelRect,
      });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${vp.name}-4-mobile-menu.png` });

      // --- 3c. We Care accordion inside mobile menu ---
      const wcClicked = await page.evaluate(() => {
        const panel = document.querySelector('div.fixed.w-64');
        if (!panel) return false;
        const btn = Array.from(panel.querySelectorAll('button')).find((b) => b.textContent.trim() === 'We Care');
        if (!btn) return false;
        btn.click();
        return true;
      });
      await new Promise((r) => setTimeout(r, 400));
      const accOverflow = await measurePage(page, vp.width);
      const accordionRect = await page.evaluate((vw) => {
        const p = Array.from(document.querySelectorAll('p')).find((p) => p.textContent === 'Welcoming');
        if (!p) return null;
        const r = p.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }, vp.width);
      log({
        phase: 'wecare-accordion-open', width: vp.name, vw: vp.width,
        wcClicked, pageOverflow: accOverflow.pageOverflow, scrollWidth: accOverflow.docScrollWidth,
        welcomingClipped: checkClip(accordionRect), welcomingRect: accordionRect,
      });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${vp.name}-5-wecare-accordion.png` });
    }

    // --- 4. Footer overflow check ---
    const footerOverflow = await page.evaluate((vw) => {
      const footer = document.querySelector('footer');
      if (!footer) return null;
      const r = footer.getBoundingClientRect();
      return { footerScrollWidth: footer.scrollWidth, footerClientWidth: footer.clientWidth, right: r.right, left: r.left };
    }, vp.width);
    const finalDocOverflow = await measurePage(page, vp.width);
    log({
      phase: 'footer-and-final-check', width: vp.name, vw: vp.width,
      footerOverflow, docPageOverflow: finalDocOverflow.pageOverflow, docScrollWidth: finalDocOverflow.docScrollWidth,
    });

    await page.close();
  }

  await browser.close();

  // Summary
  const failures = results.filter((r) => {
    return r.pageOverflow === true || r.docPageOverflow === true ||
      r.bellClipped === true || r.heartClipped === true || r.cartClipped === true ||
      r.langClipped === true || r.hamburgerClipped === true || r.panelClipped === true ||
      r.welcomingClipped === true || (r.footerOverflow && r.footerOverflow.footerScrollWidth > r.footerOverflow.footerClientWidth + 1);
  });
  console.log('\n=== SUMMARY ===');
  console.log(`Total checks: ${results.length}, Failures: ${failures.length}`);
  if (failures.length) {
    console.log('FAILURES:');
    failures.forEach((f) => console.log(JSON.stringify(f)));
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
