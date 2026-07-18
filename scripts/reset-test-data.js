#!/usr/bin/env node
/*
 * Testing utility: resets sales history, hold history, active holds, and
 * zeroes out product/inventory quantities so an admin can manually re-enter
 * quantities while testing the platform.
 *
 * Usage:
 *   node scripts/reset-test-data.js            # reset everything (default)
 *   node scripts/reset-test-data.js --qty-only  # only zero quantities, keep history
 *   node scripts/reset-test-data.js --history-only # only clear history, keep quantities
 *
 * This does NOT delete products, locations, customers, or admins — only
 * transactional/quantity data.
 */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const args = process.argv.slice(2)
const qtyOnly = args.includes('--qty-only')
const historyOnly = args.includes('--history-only')

async function main() {
  const doHistory = !qtyOnly
  const doQty = !historyOnly

  if (doHistory) {
    const [sales, holdHistory, activeHolds, txns] = await Promise.all([
      prisma.salesHistory.deleteMany({}),
      prisma.holdHistory.deleteMany({}),
      prisma.hold.deleteMany({}),
      prisma.inventoryTransaction.deleteMany({}),
    ])
    console.log(`Cleared SalesHistory: ${sales.count}`)
    console.log(`Cleared HoldHistory: ${holdHistory.count}`)
    console.log(`Cleared active Holds: ${activeHolds.count}`)
    console.log(`Cleared InventoryTransaction log: ${txns.count}`)
  }

  if (doQty) {
    const sizeInv = await prisma.sizeInventory.updateMany({
      data: { quantity: 0, heldQuantity: 0, pickedQuantity: 0 },
    })
    const products = await prisma.product.updateMany({
      data: { quantity: 0, heldQuantity: 0, pickedQuantity: 0, status: 'AVAILABLE' },
    })
    console.log(`Zeroed SizeInventory rows: ${sizeInv.count}`)
    console.log(`Zeroed Product totals: ${products.count}`)
  }

  console.log('Done. You can now set quantities manually via Prisma Studio or the admin Location Inventory modal.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
