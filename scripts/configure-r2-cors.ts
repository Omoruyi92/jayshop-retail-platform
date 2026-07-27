import { configureR2Cors } from '../src/lib/media/r2.server'

const ORIGINS = [
  'https://jayshop-retail-platform.vercel.app',
  'https://jayshop-retail-platform-p0xjk09ww.vercel.app',
  'http://localhost:3000',
]

async function main() {
  await configureR2Cors(ORIGINS)
  console.log('CORS configured for:', ORIGINS)
}

main().catch((e) => { console.error(e); process.exit(1) })
