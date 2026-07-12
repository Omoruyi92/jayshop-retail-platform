/**
 * One-off verification script: confirms getProductAvailability matches
 * manual SizeInventory sums for a multi-location product.
 *
 * Usage: npx tsx scripts/verify-aggregate.ts
 */
import { PrismaClient } from '@prisma/client'
import { buildAvailability } from '../src/lib/inventory/aggregate'

const prisma = new PrismaClient()

const TARGET_SLUG = 'toronto-blue-jays-spirit-crewneck-ivory'

async function main() {
  // 1. Find the product
  const product = await prisma.product.findUnique({
    where: { slug: TARGET_SLUG },
    select: { id: true, name: true, slug: true },
  })

  if (!product) {
    console.error(`Product not found: ${TARGET_SLUG}`)
    process.exit(1)
  }

  console.log(`\n=== Product: ${product.name} (${product.id}) ===\n`)

  // 2. Count distinct locations
  const locationCount = await prisma.sizeInventory.groupBy({
    by: ['locationId'],
    where: { productId: product.id },
  })
  console.log(`Distinct StoreLocations with inventory: ${locationCount.length}`)
  if (locationCount.length < 2) {
    console.warn('WARNING: This product has fewer than 2 locations. Multi-location test is weak.')
  }

  // 3. Call getProductAvailability via buildAvailability (same logic, avoids Next.js import)
  const rows = await prisma.sizeInventory.findMany({
    where: { productId: product.id },
    orderBy: [{ location: { sortOrder: 'asc' } }, { size: 'asc' }],
    select: {
      quantity: true,
      heldQuantity: true,
      pickedQuantity: true,
      size: true,
      location: {
        select: {
          id: true,
          name: true,
          section: true,
          gate: true,
          isMainStore: true,
          isPickupQueue: true,
          sortOrder: true,
        },
      },
    },
  })

  const availability = buildAvailability(rows)

  console.log('\n--- Service output (buildAvailability) ---')
  console.log(`  totalQuantity:    ${availability.totalQuantity}`)
  console.log(`  reservedQuantity: ${availability.reservedQuantity}`)
  console.log(`  soldQuantity:     ${availability.soldQuantity}`)
  console.log(`  availableBalance: ${availability.availableBalance}`)
  console.log(`  status:           ${availability.status}`)
  console.log(`  displayText:      ${availability.displayText}`)
  console.log(`  locations:        ${availability.locationBreakdown.length}`)

  // 4. Independent manual sums
  const allRows = await prisma.sizeInventory.findMany({
    where: { productId: product.id },
    select: { quantity: true, heldQuantity: true, pickedQuantity: true },
  })

  const manualTotal = allRows.reduce((s, r) => s + r.quantity, 0)
  const manualHeld = allRows.reduce((s, r) => s + r.heldQuantity, 0)
  const manualPicked = allRows.reduce((s, r) => s + r.pickedQuantity, 0)
  const manualAvailable = Math.max(0, manualTotal - manualHeld - manualPicked)

  console.log('\n--- Manual sums (independent query) ---')
  console.log(`  totalQuantity:    ${manualTotal}`)
  console.log(`  reservedQuantity: ${manualHeld}`)
  console.log(`  soldQuantity:     ${manualPicked}`)
  console.log(`  availableBalance: ${manualAvailable}`)

  // 5. Assertions
  const errors: string[] = []

  if (availability.totalQuantity !== manualTotal)
    errors.push(`totalQuantity mismatch: service=${availability.totalQuantity} manual=${manualTotal}`)
  if (availability.reservedQuantity !== manualHeld)
    errors.push(`reservedQuantity mismatch: service=${availability.reservedQuantity} manual=${manualHeld}`)
  if (availability.soldQuantity !== manualPicked)
    errors.push(`soldQuantity mismatch: service=${availability.soldQuantity} manual=${manualPicked}`)
  if (availability.availableBalance !== manualAvailable)
    errors.push(`availableBalance mismatch: service=${availability.availableBalance} manual=${manualAvailable}`)

  const expectedBalance = Math.max(0, availability.totalQuantity - availability.reservedQuantity - availability.soldQuantity)
  if (availability.availableBalance !== expectedBalance)
    errors.push(`availableBalance formula mismatch: service=${availability.availableBalance} expected=${expectedBalance}`)

  console.log('\n--- Assertions ---')
  if (errors.length === 0) {
    console.log('  ALL PASSED ✓')
    console.log('  totalQuantity, reservedQuantity, soldQuantity, availableBalance all match.')
    console.log('  availableBalance = max(0, total - reserved - sold) confirmed.')
  } else {
    for (const e of errors) console.error(`  FAIL: ${e}`)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
