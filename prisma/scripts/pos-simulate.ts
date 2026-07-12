/**
 * prisma/scripts/pos-simulate.ts
 *
 * CLI load-testing tool for the Phase 9 POS webhook. Fires N sequential (or
 * concurrent, with --concurrency) POST /api/pos/transaction calls against a
 * running dev server, using a dedicated CLI API key (created on first run,
 * reused on subsequent runs via env var so the raw key is never re-logged).
 *
 * Usage:
 *   npx tsx prisma/scripts/pos-simulate.ts --count 100
 *   npx tsx prisma/scripts/pos-simulate.ts --count 20 --type return --base-url http://localhost:3000
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { generateRawPosKey, POS_BCRYPT_COST } from '../../src/lib/pos/auth'

const prisma = new PrismaClient()

const CLI_KEY_NAME = 'CLI Load Test Key'

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string, fallback: string) => {
    const idx = args.indexOf(flag)
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback
  }
  return {
    count: Number(get('--count', '100')),
    type: get('--type', 'sale') as 'sale' | 'return',
    baseUrl: get('--base-url', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    concurrency: Number(get('--concurrency', '1')),
  }
}

async function getOrCreateCliKey(): Promise<string> {
  // Revoke any previous CLI key (we never persist raw keys, so a stale row
  // from an earlier run is unusable) and mint a fresh one each invocation.
  await prisma.posApiKey.updateMany({ where: { name: CLI_KEY_NAME, active: true }, data: { active: false } })
  const rawKey = generateRawPosKey()
  const keyHash = await bcrypt.hash(rawKey, POS_BCRYPT_COST)
  await prisma.posApiKey.create({ data: { name: CLI_KEY_NAME, keyHash, createdBy: 'system:cli' } })
  return rawKey
}

async function pickRandomInventoryRow(locationCode: string) {
  const rows = await prisma.sizeInventory.findMany({
    where: { location: { code: locationCode }, quantity: { gt: 5 } },
    select: { productId: true, size: true },
    take: 200,
  })
  if (rows.length === 0) throw new Error(`No SizeInventory rows with quantity > 5 found at ${locationCode}`)
  return rows[Math.floor(Math.random() * rows.length)]
}

async function fireOne(baseUrl: string, rawKey: string, type: 'sale' | 'return', index: number) {
  const row = await pickRandomInventoryRow('SEC-110')
  const externalId = `CLI-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`
  const body = {
    externalId,
    type,
    locationId: undefined,
    locationCode: 'SEC-110',
    items: [{ productId: row.productId, size: row.size, quantity: 1 }],
  }
  // The /api/pos/transaction rate limit is ~50 rps per key. A single
  // register firing occasional sales never approaches that, but this CLI's
  // whole purpose is load-testing at speed — retry with backoff on 429 so a
  // burst doesn't get reported as a false failure.
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(`${baseUrl}/api/pos/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rawKey}` },
      body: JSON.stringify(body),
    })
    if (res.status !== 429) {
      const data = await res.json().catch(() => ({}))
      return { index, status: res.status, externalId, data }
    }
    await new Promise((r) => setTimeout(r, 100 * (attempt + 1)))
  }
  return { index, status: 429, externalId, data: { error: 'Rate limit exceeded after retries' } }
}

async function main() {
  const { count, type, baseUrl, concurrency } = parseArgs()
  console.log(`[pos-simulate] Firing ${count} ${type}(s) against ${baseUrl} (concurrency=${concurrency})`)

  const rawKey = await getOrCreateCliKey()

  const results: Awaited<ReturnType<typeof fireOne>>[] = []
  const started = Date.now()

  if (concurrency <= 1) {
    for (let i = 0; i < count; i++) {
      results.push(await fireOne(baseUrl, rawKey, type, i))
    }
  } else {
    let next = 0
    const worker = async () => {
      while (next < count) {
        const i = next++
        results.push(await fireOne(baseUrl, rawKey, type, i))
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker))
  }

  const elapsedMs = Date.now() - started
  const ok = results.filter((r) => r.status === 200).length
  const deduped = results.filter((r) => r.data?.deduped).length
  const failed = results.filter((r) => r.status !== 200)

  console.log(`\n[pos-simulate] Done in ${elapsedMs}ms — ${ok}/${count} succeeded, ${deduped} deduped, ${failed.length} failed`)
  if (failed.length > 0) {
    console.log('[pos-simulate] Failures:', JSON.stringify(failed.slice(0, 5), null, 2))
  }

  await prisma.posApiKey.updateMany({ where: { name: CLI_KEY_NAME }, data: { active: false } })
  await prisma.$disconnect()

  if (failed.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error('[pos-simulate] Fatal error:', err)
  prisma.$disconnect().finally(() => process.exit(1))
})
