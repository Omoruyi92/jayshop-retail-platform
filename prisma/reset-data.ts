import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Resetting transactional data (products preserved)...')

  // Delete in FK-safe order
  await prisma.auditLog.deleteMany()
  await prisma.salesHistory.deleteMany()
  await prisma.holdHistory.deleteMany()
  await prisma.hold.deleteMany()
  await prisma.inventoryTransaction.deleteMany()
  await prisma.posEvent.deleteMany()
  await prisma.customerNotificationReceipt.deleteMany()
  await prisma.customerNotification.deleteMany()
  await prisma.customer.deleteMany()

  console.log(
    'Cleared: AuditLog, SalesHistory, HoldHistory, Hold, InventoryTransaction, PosEvent, ' +
      'CustomerNotificationReceipt, CustomerNotification, Customer'
  )

  // Reset product counters
  const updated = await prisma.product.updateMany({
    data: {
      heldQuantity: 0,
      pickedQuantity: 0,
      status: 'AVAILABLE',
    },
  })

  // Reset SizeInventory counters (must mirror product counter reset)
  const updatedSizes = await prisma.sizeInventory.updateMany({
    data: {
      heldQuantity: 0,
      pickedQuantity: 0,
    },
  })

  console.log(`Reset counters on ${updated.count} product(s) and ${updatedSizes.count} size inventory row(s)`)
  console.log('\nReset complete — products, admin, and Slack settings preserved.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
