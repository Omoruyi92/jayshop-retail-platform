const puppeteer = require('puppeteer')
const BASE = 'http://localhost:3456'

async function main() {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle2' })

  async function clickPillAndCheck(label) {
    const clicked = await page.evaluate((label) => {
      const links = Array.from(document.querySelectorAll('a'))
      const el = links.find((a) => a.textContent?.trim() === label && a.className.includes('rounded-full'))
      if (el) { el.click(); return true }
      return false
    }, label)
    await new Promise((r) => setTimeout(r, 400))
    const state = await page.evaluate(() => ({
      url: window.location.href,
      active: Array.from(document.querySelectorAll('a'))
        .filter((a) => a.className.includes('bg-jays-navy') && a.className.includes('text-white'))
        .map((a) => a.textContent?.trim()),
    }))
    console.log(label, '-> clicked:', clicked, state)
  }

  for (const label of ['Men', 'Women', 'Kids', 'Accessories', 'All']) {
    await clickPillAndCheck(label)
  }

  await browser.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
