import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Phase 3 prep: all 100 existing SizeInventory rows currently sit at SEC-110
// (the main store). To give the fan-facing "Available at" UI something real
// to render, we spread inventory for a handful of products across additional
// StoreLocations with varied quantities (zero / low / healthy).
//
// This script is idempotent: it uses upsert on the (productId, size, locationId)
// compound unique key, so re-running it will not create duplicates and will
// not touch the existing SEC-110 rows (it never targets SEC-110).

const TARGET_PRODUCT_SLUGS = [
  'toronto-blue-jays-spirit-crewneck-ivory',
  'toronto-blue-jays-92-93-champions-work-jacket-green',
  'toronto-blue-jays-nike-guerrero-limited-jersey',
  'new-era-mens',
  'toronto-blue-jays-nike-women-s-guerrero-replica-jersey',
]

const ADDITIONAL_LOCATION_CODES = ['SEC-114', 'SEC-133', 'SEC-146', 'SEC-213', 'SEC-515']

// Deterministic quantity pattern cycling zero / low / healthy across locations
// and sizes so every target product gets a realistic mix.
const QUANTITY_PATTERN = [0, 2, 8, 0, 15, 1, 6, 3, 0, 20, 4, 12]

async function main() {
  const mainStore = await prisma.storeLocation.findUniqueOrThrow({
    where: { code: 'SEC-110' },
  })

  const additionalLocations = await prisma.storeLocation.findMany({
    where: { code: { in: ADDITIONAL_LOCATION_CODES } },
    orderBy: { sortOrder: 'asc' },
  })

  if (additionalLocations.length < 3) {
    throw new Error(
      `Expected at least 3 additional locations, found ${additionalLocations.length}. Run seed-store-locations.ts first.`
    )
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: TARGET_PRODUCT_SLUGS } },
    select: { id: true, slug: true, name: true },
  })

  if (products.length < 5) {
    console.warn(
      `Warning: only found ${products.length}/${TARGET_PRODUCT_SLUGS.length} target products in DB.`
    )
  }

  let rowsCreated = 0
  let rowsUpdated = 0
  const touchedLocationCodes = new Set<string>()

  let patternIndex = 0
  const nextQuantity = () => {
    const q = QUANTITY_PATTERN[patternIndex % QUANTITY_PATTERN.length]
    patternIndex++
    return q
  }

  for (const product of products) {
    // Reuse the same size set as SEC-110 for this product so the UI can show
    // consistent size chips across locations.
    const mainSizes = await prisma.sizeInventory.findMany({
      where: { productId: product.id, locationId: mainStore.id },
      select: { size: true },
    })

    if (mainSizes.length === 0) {
      console.warn(`Skipping ${product.slug}: no SEC-110 SizeInventory rows found.`)
      continue
    }

    // Spread across 3+ additional locations (use all configured additional
    // locations if available, otherwise the first 3+ found).
    for (const location of additionalLocations) {
      for (const { size } of mainSizes) {
        const quantity = nextQuantity()

        const existing = await prisma.sizeInventory.findUnique({
          where: {
            productId_size_locationId: {
              productId: product.id,
              size,
              locationId: location.id,
            },
          },
        })

        await prisma.sizeInventory.upsert({
          where: {
            productId_size_locationId: {
              productId: product.id,
              size,
              locationId: location.id,
            },
          },
          update: { quantity },
          create: {
            productId: product.id,
            size,
            quantity,
            locationId: location.id,
          },
        })

        if (existing) rowsUpdated++
        else rowsCreated++
        touchedLocationCodes.add(location.code)
      }
    }
  }

  console.log('--- seed-multi-location-inventory summary ---')
  console.log(`Products targeted: ${products.length} (${products.map((p) => p.slug).join(', ')})`)
  console.log(`Locations touched: ${touchedLocationCodes.size} (${Array.from(touchedLocationCodes).join(', ')})`)
  console.log(`SizeInventory rows created: ${rowsCreated}`)
  console.log(`SizeInventory rows updated (idempotent re-run): ${rowsUpdated}`)
  console.log(`Total rows processed: ${rowsCreated + rowsUpdated}`)
  console.log('SEC-110 rows were not modified.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
