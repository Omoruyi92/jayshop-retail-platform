import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting full data wipe...')

  // Delete everything in FK-safe order inside a single transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. AuditLog references Admin — must go first
    const auditLog = await tx.auditLog.deleteMany()

    // 2. HoldHistory references Admin (resolvedBy)
    const holdHistory = await tx.holdHistory.deleteMany()

    // 3. SalesHistory references Admin (soldBy)
    const salesHistory = await tx.salesHistory.deleteMany()

    // 4. Hold references Customer and Product
    const hold = await tx.hold.deleteMany()

    // 5. Customer (no more FK from Hold after step 4)
    const customer = await tx.customer.deleteMany()

    // 6. SizeInventory references Product
    const sizeInventory = await tx.sizeInventory.deleteMany()

    // 7. Product (all FK children cleared)
    const product = await tx.product.deleteMany()

    return { auditLog, holdHistory, salesHistory, hold, customer, sizeInventory, product }
  })

  console.log('\nDeleted:')
  console.log(`  AuditLog     : ${result.auditLog.count}`)
  console.log(`  HoldHistory  : ${result.holdHistory.count}`)
  console.log(`  SalesHistory : ${result.salesHistory.count}`)
  console.log(`  Hold         : ${result.hold.count}`)
  console.log(`  Customer     : ${result.customer.count}`)
  console.log(`  SizeInventory: ${result.sizeInventory.count}`)
  console.log(`  Product      : ${result.product.count}`)

  // --- Post-wipe verification ---
  console.log('\n--- Post-wipe counts ---')
  const [
    productCount,
    sizeInventoryCount,
    holdCount,
    customerCount,
    holdHistoryCount,
    salesHistoryCount,
    auditLogCount,
    adminCount,
    slackSettingsCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.sizeInventory.count(),
    prisma.hold.count(),
    prisma.customer.count(),
    prisma.holdHistory.count(),
    prisma.salesHistory.count(),
    prisma.auditLog.count(),
    prisma.admin.count(),
    prisma.slackSettings.count(),
  ])

  console.log(`  Product       = ${productCount}`)
  console.log(`  SizeInventory = ${sizeInventoryCount}`)
  console.log(`  Hold          = ${holdCount}`)
  console.log(`  Customer      = ${customerCount}`)
  console.log(`  HoldHistory   = ${holdHistoryCount}`)
  console.log(`  SalesHistory  = ${salesHistoryCount}`)
  console.log(`  AuditLog      = ${auditLogCount}`)
  console.log(`  Admin         = ${adminCount}   (must be >= 1)`)
  console.log(`  SlackSettings = ${slackSettingsCount}`)

  // Acceptance checks
  const errors: string[] = []
  if (productCount !== 0) errors.push(`Product not 0 (got ${productCount})`)
  if (sizeInventoryCount !== 0) errors.push(`SizeInventory not 0 (got ${sizeInventoryCount})`)
  if (holdCount !== 0) errors.push(`Hold not 0 (got ${holdCount})`)
  if (customerCount !== 0) errors.push(`Customer not 0 (got ${customerCount})`)
  if (holdHistoryCount !== 0) errors.push(`HoldHistory not 0 (got ${holdHistoryCount})`)
  if (salesHistoryCount !== 0) errors.push(`SalesHistory not 0 (got ${salesHistoryCount})`)
  if (adminCount < 1) errors.push(`Admin count is 0 — admin account missing!`)

  if (errors.length > 0) {
    console.error('\nACCEPTANCE FAILURES:')
    errors.forEach((e) => console.error(`  ✗ ${e}`))
    process.exit(1)
  }

  console.log('\nAll acceptance checks passed.')
  console.log('Data wipe complete. Admin and SlackSettings preserved.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
