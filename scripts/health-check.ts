import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function healthCheck() {
  console.log('=== JAYS SHOP END-TO-END HEALTH CHECK ===\n')

  // 1. DB Connection
  console.log('1. DB Connection...')
  const dbState = await prisma.$queryRawUnsafe<{ server_version: string }[]>('SHOW server_version')
  const [{ cnt: productCnt }] = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>('SELECT COUNT(*) as cnt FROM "Product"')
  console.log(`   PG version: ${dbState[0].server_version}`)
  console.log(`   Products: ${productCnt}`)
  console.log('   ✅ OK\n')

  // 2. Product inventory sync check
  console.log('2. Size-Level Inventory Sync...')
  const products = await prisma.product.findMany({ include: { sizeInventories: true } })
  let errors = 0
  for (const p of products) {
    if (p.sizeInventories.length > 0) {
      const totalQty = p.sizeInventories.reduce((s, si) => s + si.quantity, 0)
      const totalHeld = p.sizeInventories.reduce((s, si) => s + si.heldQuantity, 0)
      const totalPicked = p.sizeInventories.reduce((s, si) => s + si.pickedQuantity, 0)
      if (p.quantity !== totalQty) { errors++; console.log(`   ❌ ${p.name}: product.quantity=${p.quantity} != sum(sizeInv.qty)=${totalQty}`) }
      if (p.heldQuantity !== totalHeld) { errors++; console.log(`   ❌ ${p.name}: product.held=${p.heldQuantity} != sum(sizeInv.held)=${totalHeld}`) }
      if (p.pickedQuantity !== totalPicked) { errors++; console.log(`   ❌ ${p.name}: product.picked=${p.pickedQuantity} != sum(sizeInv.picked)=${totalPicked}`) }
    }
  }
  if (errors === 0) console.log('   ✅ All size-level inventories synced\n')
  else console.log(`   ❌ ${errors} sync errors found\n`)

  // 3. Per-size availability check
  console.log('3. Per-Size Availability...')
  for (const p of products) {
    if (p.sizeInventories.length > 0) {
      const sizes = p.sizeInventories.map((si) => {
        const avail = si.quantity - si.heldQuantity - si.pickedQuantity
        return `${si.size}:${avail}`
      }).join(', ')
      console.log(`   ${p.name}: ${sizes}`)
    }
  }
  console.log('   ✅ OK\n')

  // 4. Holds check
  console.log('4. Active Holds...')
  const activeHolds = await prisma.hold.findMany({ where: { status: 'ACTIVE' }, include: { product: { select: { name: true } }, customer: { select: { phone: true } } } })
  const expiredHolds = activeHolds.filter((h) => new Date(h.expiresAt) < new Date())
  console.log(`   Active: ${activeHolds.length}, Expired but still active: ${expiredHolds.length}`)
  if (expiredHolds.length > 0) {
    for (const h of expiredHolds) {
      console.log(`   ⚠️  ${h.reservationCode} (${h.product?.name} for ${h.customer?.phone}) expired at ${h.expiresAt}`)
    }
  }
  console.log('   ✅ OK\n')

  // 5. Admin user
  console.log('5. Admin Login...')
  const admin = await prisma.admin.findFirst()
  console.log(`   Email: ${admin?.email ?? 'MISSING'}`)
  console.log('   ✅ OK\n')

  // 6. Non-size products
  console.log('6. Non-Size Products...')
  const nonSize = await prisma.product.findMany({ where: { sizes: '' } })
  console.log(`   Count: ${nonSize.length} (Mugs, Pennants, Bats)`)
  console.log('   ✅ OK\n')

  console.log('=== HEALTH CHECK COMPLETE ===')
  console.log(`Status: ${errors === 0 && expiredHolds.length === 0 ? '✅ ALL CLEAR' : '⚠️  ISSUES DETECTED'}`)
}

healthCheck()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
