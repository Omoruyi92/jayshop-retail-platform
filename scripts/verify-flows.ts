/**
 * Phase 3 Verification Script — hold creation → pickup → inventory sync
 * Run: npx ts-node --project tsconfig.json -e "require('./scripts/verify-flows')"
 * or:  node --loader ts-node/esm scripts/verify-flows.ts
 */
import { PrismaClient } from '@prisma/client'
import { resolveHold } from '../src/lib/holds/resolveHold'
import { createHold } from '../src/lib/holds/createHold'

const prisma = new PrismaClient()

function log(msg: string) { console.log(msg) }
function separator(title: string) { console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`) }
function ok(msg: string) { console.log(`  [PASS] ${msg}`) }
function fail(msg: string) { console.error(`  [FAIL] ${msg}`); process.exitCode = 1 }

async function getProduct(id: string) {
  return prisma.product.findUniqueOrThrow({ where: { id } })
}

async function getHold(id: string) {
  return prisma.hold.findUniqueOrThrow({ where: { id } })
}

async function main() {
  const PRODUCT_ID = 'cmpi3iiaw000013kffrvhc6wl'
  const PHONE_BASE = '555000000'

  // --- Initial baseline ---
  const baseline = await getProduct(PRODUCT_ID)
  log(`\nBaseline: qty=${baseline.quantity} heldQty=${baseline.heldQuantity} pickedQty=${baseline.pickedQuantity} status=${baseline.status}`)

  // =========================================================
  // FLOW 1: Full pickup (no fulfilledQty → defaults to holdQuantity)
  // =========================================================
  separator('FLOW 1: Full Pickup')

  const h1 = await createHold(PRODUCT_ID, {
    fullName: 'Test Customer One',
    phone: `${PHONE_BASE}1`,
    quantity: 1,
  })
  log(`  Created hold: ${h1.id} (code=${h1.reservationCode}, qty=1)`)

  const p1Before = await getProduct(PRODUCT_ID)
  log(`  After create: heldQty=${p1Before.heldQuantity} pickedQty=${p1Before.pickedQuantity}`)

  // Resolve with fulfilledQty = holdQuantity (full pickup)
  await resolveHold(h1.id, 'PICKED_UP', undefined, h1.holdQuantity)

  const resolvedH1 = await getHold(h1.id)
  const p1After = await getProduct(PRODUCT_ID)
  const hh1 = await prisma.holdHistory.findFirst({ where: { holdId: h1.id } })
  const sh1 = await prisma.salesHistory.findFirst({ where: { holdId: h1.id } })

  log(`  Hold.status = ${resolvedH1.status} (expected PICKED_UP)`)
  resolvedH1.status === 'PICKED_UP' ? ok('Hold.status = PICKED_UP') : fail(`Hold.status = ${resolvedH1.status} (expected PICKED_UP)`)
  hh1 ? ok('HoldHistory row created') : fail('HoldHistory row MISSING')
  sh1 ? ok('SalesHistory row created') : fail('SalesHistory row MISSING')
  log(`  Product heldQty diff: ${baseline.heldQuantity} → ${p1Before.heldQuantity} (after create) → ${p1After.heldQuantity} (after resolve)`)
  p1After.heldQuantity === baseline.heldQuantity
    ? ok(`heldQuantity back to baseline (${baseline.heldQuantity})`)
    : fail(`heldQuantity = ${p1After.heldQuantity} (expected ${baseline.heldQuantity})`)
  p1After.pickedQuantity === baseline.pickedQuantity + 1
    ? ok(`pickedQuantity incremented to ${p1After.pickedQuantity}`)
    : fail(`pickedQuantity = ${p1After.pickedQuantity} (expected ${baseline.pickedQuantity + 1})`)

  // =========================================================
  // FLOW 2: Partial pickup (qty=2, fulfilledQty=1)
  // =========================================================
  separator('FLOW 2: Partial Pickup (qty=2, fulfilled=1)')

  const p2Baseline = await getProduct(PRODUCT_ID)
  const h2 = await createHold(PRODUCT_ID, {
    fullName: 'Test Customer Two',
    phone: `${PHONE_BASE}2`,
    quantity: 2,
  })
  log(`  Created hold: ${h2.id} (code=${h2.reservationCode}, qty=2)`)

  const p2Before = await getProduct(PRODUCT_ID)
  log(`  After create: heldQty=${p2Before.heldQuantity} pickedQty=${p2Before.pickedQuantity}`)

  await resolveHold(h2.id, 'PICKED_UP', undefined, 1) // partial: fulfill only 1

  const resolvedH2 = await getHold(h2.id)
  const p2After = await getProduct(PRODUCT_ID)
  const hh2 = await prisma.holdHistory.findFirst({ where: { holdId: h2.id } })
  const sh2 = await prisma.salesHistory.findFirst({ where: { holdId: h2.id } })
  // The new hold for remainingQty=1 should be ACTIVE
  const newHold2 = await prisma.hold.findFirst({
    where: {
      customerId: h2.customerId,
      productId: PRODUCT_ID,
      status: 'ACTIVE',
      holdQuantity: 1,
    },
    orderBy: { placedAt: 'desc' }
  })

  resolvedH2.status === 'PICKED_UP' ? ok('Original Hold.status = PICKED_UP') : fail(`Original Hold.status = ${resolvedH2.status} (expected PICKED_UP)`)
  newHold2 ? ok(`New ACTIVE hold created for remainingQty=1 (id=${newHold2.id})`) : fail('No new ACTIVE hold for remainingQty')
  hh2 ? ok('HoldHistory row created') : fail('HoldHistory row MISSING')
  sh2 ? ok('SalesHistory row created') : fail('SalesHistory row MISSING')

  // pickedQty should have incremented by 1, heldQty should have incremented by 1 net (back to what a hold of 1 adds)
  log(`  Product: baseline heldQty=${p2Baseline.heldQuantity} pickedQty=${p2Baseline.pickedQuantity}`)
  log(`  Product: after resolve heldQty=${p2After.heldQuantity} pickedQty=${p2After.pickedQuantity}`)
  // Net: create adds +2, partial resolve: -1 (fulfilled) and remainder stays in existing held slot = net +1
  // So final heldQty = baseline + 1 (remainder still held)
  const expectedHeld2 = p2Baseline.heldQuantity + 1 // 1 remaining unit still on hold
  const expectedPicked2 = p2Baseline.pickedQuantity + 1 // 1 was fulfilled
  p2After.heldQuantity === expectedHeld2
    ? ok(`heldQuantity = ${p2After.heldQuantity} (correct: 1 remainder still held, net +1 from baseline)`)
    : fail(`heldQuantity = ${p2After.heldQuantity} (expected ${expectedHeld2})`)
  p2After.pickedQuantity === expectedPicked2
    ? ok(`pickedQuantity = ${p2After.pickedQuantity} (correct: 1 picked up)`)
    : fail(`pickedQuantity = ${p2After.pickedQuantity} (expected ${expectedPicked2})`)

  // cleanup: release the remainder hold so it doesn't affect flow 3
  if (newHold2) {
    await resolveHold(newHold2.id, 'RELEASED', undefined, 0)
    log(`  (Cleaned up remainder hold: released)`)
  }

  // =========================================================
  // FLOW 3: Release (fulfilledQty=0)
  // =========================================================
  separator('FLOW 3: Release (fulfilledQty=0)')

  const p3Baseline = await getProduct(PRODUCT_ID)
  const h3 = await createHold(PRODUCT_ID, {
    fullName: 'Test Customer Three',
    phone: `${PHONE_BASE}3`,
    quantity: 1,
  })
  log(`  Created hold: ${h3.id} (code=${h3.reservationCode}, qty=1)`)

  await resolveHold(h3.id, 'RELEASED', undefined, 0)

  const resolvedH3 = await getHold(h3.id)
  const p3After = await getProduct(PRODUCT_ID)
  const hh3 = await prisma.holdHistory.findFirst({ where: { holdId: h3.id } })
  const sh3 = await prisma.salesHistory.findFirst({ where: { holdId: h3.id } })

  resolvedH3.status === 'RELEASED' ? ok('Hold.status = RELEASED') : fail(`Hold.status = ${resolvedH3.status} (expected RELEASED)`)
  hh3 ? ok('HoldHistory row created') : fail('HoldHistory row MISSING')
  !sh3 ? ok('NO SalesHistory row (correct for release)') : fail('SalesHistory row exists (should NOT for release)')
  log(`  Product: baseline heldQty=${p3Baseline.heldQuantity} → after release heldQty=${p3After.heldQuantity}`)
  p3After.heldQuantity === p3Baseline.heldQuantity
    ? ok(`heldQuantity back to baseline (${p3After.heldQuantity})`)
    : fail(`heldQuantity = ${p3After.heldQuantity} (expected ${p3Baseline.heldQuantity})`)

  // Final DB summary
  separator('Final DB State')
  const final = await getProduct(PRODUCT_ID)
  log(`  Product: qty=${final.quantity} heldQty=${final.heldQuantity} pickedQty=${final.pickedQuantity} status=${final.status}`)
  const holdCounts = await prisma.hold.groupBy({ by: ['status'], _count: true })
  log(`  Hold counts: ${JSON.stringify(holdCounts)}`)

  if (process.exitCode === 1) {
    console.error('\n[RESULT] SOME TESTS FAILED')
  } else {
    console.log('\n[RESULT] ALL TESTS PASSED')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
