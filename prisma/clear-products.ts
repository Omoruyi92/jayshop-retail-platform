import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting catalog reset...')

  await prisma.$transaction(async (tx) => {
    // Step 1: Snapshot & archive any remaining active holds before deletion
    const activeHolds = await tx.hold.findMany({
      where: { status: 'ACTIVE' },
      include: { product: true, customer: true },
    })

    if (activeHolds.length > 0) {
      console.log(`Archiving ${activeHolds.length} active hold(s) before product deletion...`)
      await tx.holdHistory.createMany({
        data: activeHolds.map((h) => ({
          holdId: h.id,
          reservationCode: h.reservationCode,
          productId: h.productId,
          productNameSnapshot: h.product.name,
          productBrandSnapshot: h.product.brand,
          productPriceCentsSnapshot: h.product.priceCents,
          productImageUrlSnapshot: h.product.imageUrl,
          customerId: h.customerId,
          customerNameSnapshot: h.customer.fullName,
          customerPhoneSnapshot: h.customer.phone,
          holdQuantity: h.holdQuantity,
          fulfilledQuantity: 0,
          totalPriceCentsSnapshot: h.totalPriceCents,
          finalTotalCents: 0,
          placedAt: h.placedAt,
          expiresAt: h.expiresAt,
          finalStatus: 'CANCELLED_SYSTEM',
          resolvedAt: new Date(),
          notes: 'Archived during catalog reset — product data cleared',
        })),
      })
      await tx.hold.deleteMany({ where: { status: 'ACTIVE' } })
      console.log('Active holds archived and removed.')
    }

    // Step 2: Delete any remaining Hold rows (EXPIRED, RELEASED, etc.)
    // Hold.productId is ON DELETE RESTRICT, so all holds must be cleared first.
    const remainingHoldCount = await tx.hold.count()
    if (remainingHoldCount > 0) {
      await tx.hold.deleteMany()
      console.log(`Cleared ${remainingHoldCount} remaining hold row(s).`)
    }

    // Step 3: Delete all products — SizeInventory rows cascade automatically
    const { count } = await tx.product.deleteMany()
    console.log(`Deleted ${count} product(s) — SizeInventory rows removed via cascade.`)
  })

  // Post-reset verification
  const [products, sizeInv, holds, customers, holdHistory, salesHistory, admins] =
    await Promise.all([
      prisma.product.count(),
      prisma.sizeInventory.count(),
      prisma.hold.count(),
      prisma.customer.count(),
      prisma.holdHistory.count(),
      prisma.salesHistory.count(),
      prisma.admin.count(),
    ])

  console.log('\n=== Post-Reset Verification ===')
  console.log(`Products:      ${products}   (expected: 0)`)
  console.log(`SizeInventory: ${sizeInv}   (expected: 0)`)
  console.log(`Holds:         ${holds}   (expected: 0)`)
  console.log(`Customers:     ${customers}   (preserved)`)
  console.log(`HoldHistory:   ${holdHistory}   (preserved)`)
  console.log(`SalesHistory:  ${salesHistory}   (preserved)`)
  console.log(`Admins:        ${admins}   (expected: ≥1)`)

  if (products !== 0 || sizeInv !== 0) {
    throw new Error('Verification failed: product or size inventory rows remain.')
  }
  if (admins < 1) {
    throw new Error('Verification failed: no admin account found.')
  }

  console.log('\nCatalog reset complete. Admin can now add products manually.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
