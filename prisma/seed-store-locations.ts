import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getDefaultTenantId() {
  const tenant = await prisma.tenant.findFirst({ where: { isDefault: true } })
  if (tenant) return tenant.id

  const created = await prisma.tenant.create({
    data: { name: 'Default', slug: 'default', isDefault: true },
  })
  return created.id
}

interface LocationSeed {
  code: string
  name: string
  section?: string
  gate?: string
  isMainStore?: boolean
  isPickupQueue?: boolean
  sortOrder: number
}

const LOCATIONS: LocationSeed[] = [
  { code: 'SEC-110', name: 'Section 110 / Gate 5', section: '110', gate: '5', isMainStore: true, sortOrder: 1 },
  { code: 'GATE-1', name: 'Gate 1', sortOrder: 2 },
  { code: 'SEC-114', name: 'Section 114', sortOrder: 3 },
  { code: 'SEC-123', name: 'Section 123', isPickupQueue: true, sortOrder: 4 },
  { code: 'SEC-133', name: 'Section 133', sortOrder: 5 },
  { code: 'SEC-136', name: 'Section 136', sortOrder: 6 },
  { code: 'SEC-146', name: 'Section 146', sortOrder: 7 },
  { code: 'SEC-213', name: 'Section 213', sortOrder: 8 },
  { code: 'SEC-235', name: 'Section 235', sortOrder: 9 },
  { code: 'SEC-515', name: 'Section 515', sortOrder: 10 },
  { code: 'SEC-525', name: 'Section 525', sortOrder: 11 },
  { code: 'SEC-530', name: 'Section 530', sortOrder: 12 },
]

async function seedLocations() {
  const tenantId = await getDefaultTenantId()

  for (const loc of LOCATIONS) {
    await prisma.storeLocation.upsert({
      where: { code: loc.code },
      update: {
        name: loc.name,
        section: loc.section ?? null,
        gate: loc.gate ?? null,
        isMainStore: loc.isMainStore ?? false,
        isPickupQueue: loc.isPickupQueue ?? false,
        sortOrder: loc.sortOrder,
        tenantId,
      },
      create: {
        code: loc.code,
        name: loc.name,
        section: loc.section ?? null,
        gate: loc.gate ?? null,
        isMainStore: loc.isMainStore ?? false,
        isPickupQueue: loc.isPickupQueue ?? false,
        sortOrder: loc.sortOrder,
        tenantId,
      },
    })
  }
  console.log(`Seeded ${LOCATIONS.length} StoreLocation rows.`)
}

async function backfillSizeInventory() {
  const mainStore = await prisma.storeLocation.findUniqueOrThrow({
    where: { code: 'SEC-110' },
  })

  // Raw SQL: locationId is NOT NULL in the current (tightened) schema, so the
  // Prisma Client types no longer allow filtering/updating by `null`. This
  // backfill only has work to do when re-run against a pre-tightening
  // (nullable locationId) database state, so we use $executeRawUnsafe /
  // $queryRawUnsafe to stay compatible with either schema state.
  const updatedCount = await prisma.$executeRawUnsafe(
    `UPDATE "SizeInventory" SET "locationId" = $1 WHERE "locationId" IS NULL`,
    mainStore.id
  )
  console.log(`Backfilled ${updatedCount} SizeInventory rows to ${mainStore.code} (${mainStore.id}).`)

  const [{ count: nullCount }] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::int as count FROM "SizeInventory" WHERE "locationId" IS NULL`
  )
  const mainCount = await prisma.sizeInventory.count({ where: { locationId: mainStore.id } })
  console.log(`Verification: locationId IS NULL count = ${nullCount}`)
  console.log(`Verification: locationId = SEC-110 count = ${mainCount}`)

  if (Number(nullCount) !== 0) {
    throw new Error(`Backfill incomplete: ${nullCount} SizeInventory rows still have NULL locationId`)
  }

  return mainStore
}

async function main() {
  await seedLocations()
  await backfillSizeInventory()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
