/**
 * One-off port script: copies legacy hand-curated catalog data from the
 * SQLite dev.db (prisma/dev.db, read-only) into the current PostgreSQL
 * database, preserving all IDs, timestamps, and field values verbatim.
 *
 * Usage: npx tsx prisma/port-legacy-sqlite.ts
 *
 * NOTE: This does NOT touch prisma/dev.db (opened readonly). It assumes
 * the target Product/SizeInventory tables in Postgres have already been
 * cleared (see prisma/clear-products.ts) so IDs/slugs won't collide.
 */
import Database from 'better-sqlite3'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const sqliteDbPath = path.join(__dirname, 'dev.db')

interface LegacyProduct {
  id: string
  name: string
  slug: string
  description: string | null
  priceCents: number
  imageUrl: string
  category: string
  subcategory: string
  ageGroup: string
  hatStyle: string
  quantity: number
  heldQuantity: number
  pickedQuantity: number
  sizes: string
  brand: string
  status: string
  isLicensed: number
  isChampion: number
  isBestSeller: number
  isClearance: number
  createdAt: number
  updatedAt: number
}

interface LegacySizeInventory {
  id: string
  productId: string
  size: string
  quantity: number
  heldQuantity: number
  pickedQuantity: number
}

async function main() {
  const sqlite = new Database(sqliteDbPath, { readonly: true, fileMustExist: true })
  const tenant = await prisma.tenant.findFirst({ where: { isDefault: true } }) ?? await prisma.tenant.findFirstOrThrow()
  const location = await prisma.storeLocation.findFirst({ where: { isMainStore: true } }) ?? await prisma.storeLocation.findFirstOrThrow()

  // --- Category table (port only if it exists and has rows) ---
  const categoryTableExists = sqlite
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='Category'`)
    .get()
  if (categoryTableExists) {
    const categories = sqlite.prepare('SELECT * FROM Category').all()
    console.log(`Found ${categories.length} legacy Category rows.`)
    for (const c of categories as any[]) {
      console.log(`Copying category: ${JSON.stringify(c)}`)
      // No Category model currently exists in the Prisma schema; log only.
    }
  } else {
    console.log('No legacy Category table found — skipping.')
  }

  // --- Product ---
  const legacyProducts = sqlite.prepare('SELECT * FROM Product').all() as LegacyProduct[]
  console.log(`\nFound ${legacyProducts.length} legacy Product rows. Porting...`)

  for (const p of legacyProducts) {
    await prisma.product.create({
      data: {
        id: p.id,
        tenantId: tenant.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        category: p.category,
        subcategory: p.subcategory,
        ageGroup: p.ageGroup,
        hatStyle: p.hatStyle,
        quantity: p.quantity,
        heldQuantity: p.heldQuantity,
        pickedQuantity: p.pickedQuantity,
        sizes: p.sizes,
        brand: p.brand,
        status: p.status,
        isLicensed: Boolean(p.isLicensed),
        isChampion: Boolean(p.isChampion),
        isBestSeller: Boolean(p.isBestSeller),
        isClearance: Boolean(p.isClearance),
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    })
    console.log(`  Copied Product: ${p.id} — ${p.name}`)
  }

  // --- SizeInventory ---
  const legacySizeInventories = sqlite.prepare('SELECT * FROM SizeInventory').all() as LegacySizeInventory[]
  console.log(`\nFound ${legacySizeInventories.length} legacy SizeInventory rows. Porting...`)

  for (const si of legacySizeInventories) {
    await prisma.sizeInventory.create({
      data: {
        id: si.id,
        productId: si.productId,
        size: si.size,
        locationId: location.id,
        quantity: si.quantity,
        heldQuantity: si.heldQuantity,
        pickedQuantity: si.pickedQuantity,
      },
    })
    console.log(`  Copied SizeInventory: ${si.id} (product ${si.productId}, size ${si.size})`)
  }

  sqlite.close()

  const pgProductCount = await prisma.product.count()
  const pgSizeInventoryCount = await prisma.sizeInventory.count()

  console.log('\n--- Summary ---')
  console.log(`Legacy Product rows:        ${legacyProducts.length}`)
  console.log(`Postgres Product rows:      ${pgProductCount}`)
  console.log(`Legacy SizeInventory rows:  ${legacySizeInventories.length}`)
  console.log(`Postgres SizeInventory rows:${pgSizeInventoryCount}`)

  if (pgProductCount !== legacyProducts.length) {
    console.warn('WARNING: Product count mismatch!')
  }
  if (pgSizeInventoryCount !== legacySizeInventories.length) {
    console.warn('WARNING: SizeInventory count mismatch!')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
