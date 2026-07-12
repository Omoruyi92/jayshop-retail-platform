import { prisma } from '@/lib/prisma'

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

