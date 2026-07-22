import { prisma } from '@/lib/prisma'
import { getDefaultTenantId } from '@/lib/tenant'

// The 12 predefined store/pickup locations this app is designed around.
// Kept in sync with prisma/seed-store-locations.ts (the one-off CLI seeder).
// This copy backs `ensureAllStoreLocations()`, a runtime self-heal that
// idempotently upserts (never deletes) these rows so that if a production
// database is ever missing some of them, they get restored automatically
// the next time an admin opens the product Locations/Inventory modal.
interface PredefinedLocation {
  code: string
  name: string
  section?: string
  gate?: string
  isMainStore?: boolean
  isPickupQueue?: boolean
  sortOrder: number
}

const PREDEFINED_LOCATIONS: PredefinedLocation[] = [
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

/**
 * Idempotently ensures all 12 predefined store locations exist and are
 * active. Never deletes or archives existing rows — only creates missing
 * ones and re-activates/repairs fields on existing ones by code. Safe to
 * call on every request that renders the location list (upserts on an
 * already-correct DB are cheap no-op writes).
 */
export async function ensureAllStoreLocations(): Promise<void> {
  const tenantId = await getDefaultTenantId()
  await Promise.all(
    PREDEFINED_LOCATIONS.map((loc) =>
      prisma.storeLocation.upsert({
        where: { code: loc.code },
        update: {
          name: loc.name,
          section: loc.section ?? null,
          gate: loc.gate ?? null,
          isMainStore: loc.isMainStore ?? false,
          isPickupQueue: loc.isPickupQueue ?? false,
          sortOrder: loc.sortOrder,
          active: true,
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
    )
  )
}

// Phase 2 compatibility helper: existing (pre-multi-location) code assumes
// every SizeInventory row belongs to "the store". Post-migration that means
// Section 110 (the main store). This resolves and caches that location's id
// so legacy single-location queries keep working correctly.
//
// TODO(Phase 3): remove once consumers are updated to be location-aware.
let cachedMainStoreId: string | null = null

export async function getMainStoreLocationId(): Promise<string> {
  if (cachedMainStoreId) return cachedMainStoreId
  const mainStore = await prisma.storeLocation.findFirstOrThrow({
    where: { isMainStore: true },
    select: { id: true },
  })
  cachedMainStoreId = mainStore.id
  return cachedMainStoreId
}

// Phase 6: default pickup queue for stadium holds (Section 123).
let cachedPickupQueueId: string | null = null

export async function getPickupQueueLocationId(): Promise<string> {
  if (cachedPickupQueueId) return cachedPickupQueueId
  const pickupQueue = await prisma.storeLocation.findFirstOrThrow({
    where: { isPickupQueue: true },
    select: { id: true },
  })
  cachedPickupQueueId = pickupQueue.id
  return cachedPickupQueueId
}

/**
 * Resolve the location to reserve inventory from based on a hold type.
 * Stadium hold → pickup queue (Section 123).
 * Standard/Gate 5 hold → main store (Section 110).
 */
export async function getHoldReservationLocationId(isStadiumHold: boolean): Promise<string> {
  return isStadiumHold ? getPickupQueueLocationId() : getMainStoreLocationId()
}

