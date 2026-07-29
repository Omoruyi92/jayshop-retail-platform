import { configureR2Cors } from '../src/lib/media/r2.server'

// Ordered with the stable production origin FIRST so it's obvious at a
// glance which entry is durable. Vercel preview-deploy URLs rotate on every
// deploy (a new random subdomain each time), so any preview origin below is
// expected to go stale and need replacing — see docs/R2_CORS_SETUP.md for
// why this list has already gone stale once before (the p0xjk09ww preview
// origin below is a leftover from an earlier deploy and no longer resolves
// to anything in use).
const ORIGINS = [
  'https://jayshop-retail-platform.vercel.app',
  'https://jayshop-retail-platform-77cyjfa08.vercel.app',
  'https://jayshop-retail-platform-p0xjk09ww.vercel.app',
  'http://localhost:3000',
]

async function main() {
  await configureR2Cors(ORIGINS)
  console.log('CORS configured for:', ORIGINS)
}

main().catch((e) => { console.error(e); process.exit(1) })
