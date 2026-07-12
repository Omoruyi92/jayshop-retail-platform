import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Phase 6 prep: SEC-123 (isPickupQueue=true) currently has zero SizeInventory
// rows, but createHold now reserves exclusively from SEC-123. This script
// seeds realistic test stock at SEC-123 by copying a fraction of each SEC-110
// row's quantity (40%, min 0, max 30) — SEC-110 quantities are left untouched.
//
// Idempotent via upsert on the (productId, size, locationId) compound unique
// key, so re-running is safe and will not create duplicates.

function scaledQuantity(sec110Qty: number): number {
  const scaled = Math.floor(sec110Qty * 0.4)
  return Math.max(0, Math.min(30, scaled))
}

async function main() {
  const mainStore = await prisma.storeLocation.findUniqueOrThrow({ where: { code: 'SEC-110' } })
  const pickupQueue = await prisma.storeLocation.findUniqueOrThrow({ where: { code: 'SEC-123' } })

  const mainStoreRows = await prisma.sizeInventory.findMany({
    where: { locationId: mainStore.id },
    select: { productId: true, size: true, quantity: true },
  })

  let rowsCreated = 0
  let rowsUpdated = 0
  let totalUnitsAdded = 0

  for (const row of mainStoreRows) {
    const quantity = scaledQuantity(row.quantity)

    const existing = await prisma.sizeInventory.findUnique({
      where: {
        productId_size_locationId: {
          productId: row.productId,
          size: row.size,
          locationId: pickupQueue.id,
        },
      },
    })

    await prisma.sizeInventory.upsert({
      where: {
        productId_size_locationId: {
          productId: row.productId,
          size: row.size,
          locationId: pickupQueue.id,
        },
      },
      update: { quantity },
      create: {
        productId: row.productId,
        size: row.size,
        quantity,
        locationId: pickupQueue.id,
      },
    })

    if (existing) rowsUpdated++
    else rowsCreated++
    totalUnitsAdded += quantity
  }

  console.log('--- seed-section-123-stock summary ---')
  console.log(`SEC-110 rows processed: ${mainStoreRows.length}`)
  console.log(`SEC-123 rows created: ${rowsCreated}`)
  console.log(`SEC-123 rows updated (idempotent re-run): ${rowsUpdated}`)
  console.log(`Total units added to SEC-123: ${totalUnitsAdded}`)
  console.log('SEC-110 quantities were not modified.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
