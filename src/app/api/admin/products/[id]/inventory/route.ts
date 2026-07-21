import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import { logInventoryTransaction, resolveActorFromSession } from '@/lib/inventory/logTransaction'
import { aggregateAvailable, syncProductTotalsFromSizeInventory } from '@/lib/inventory/availability'
import { getProductAvailability } from '@/lib/inventory/aggregate'
import { parseJsonBody, apiErrorResponse, badRequest } from '@/lib/api/request'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/products/[id]/inventory
 * Returns per-location per-size inventory for the admin location editor.
 * Includes ALL active store locations (even ones the product isn't
 * assigned to yet) so the UI can offer "Assign to this location".
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'inventory:read')
  if (error) return error

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const [allLocations, sizeRows] = await Promise.all([
    prisma.storeLocation.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        isMainStore: true,
        isPickupQueue: true,
      },
    }),
    prisma.sizeInventory.findMany({
      where: { productId: params.id },
      select: {
        locationId: true,
        size: true,
        quantity: true,
        heldQuantity: true,
        pickedQuantity: true,
      },
      orderBy: { size: 'asc' },
    }),
  ])

  const sizesByLocation = new Map<
    string,
    { size: string; quantity: number; heldQuantity: number; pickedQuantity: number }[]
  >()
  for (const row of sizeRows) {
    if (!sizesByLocation.has(row.locationId)) sizesByLocation.set(row.locationId, [])
    sizesByLocation.get(row.locationId)!.push({
      size: row.size,
      quantity: row.quantity,
      heldQuantity: row.heldQuantity,
      pickedQuantity: row.pickedQuantity,
    })
  }

  // Enrich with per-location aggregate metrics from the centralised service
  const availability = await getProductAvailability(params.id)
  const breakdownByLoc = new Map(
    availability.locationBreakdown.map((lb) => [lb.locationId, lb])
  )

  const inventoryByLocation = allLocations.map((loc) => {
    const lb = breakdownByLoc.get(loc.id)
    return {
      locationId: loc.id,
      code: loc.code,
      name: loc.name,
      isMainStore: loc.isMainStore,
      isPickupQueue: loc.isPickupQueue,
      assigned: sizesByLocation.has(loc.id),
      sizes: sizesByLocation.get(loc.id) ?? [],
      availableBalance: lb?.available ?? 0,
      soldQuantity: lb?.picked ?? 0,
    }
  })

  return NextResponse.json({
    productId: params.id,
    inventoryByLocation,
    allLocations,
  })
}

type IncomingSize = { size: string; quantity: number }
type IncomingLocationEntry = { locationId: string; sizes: IncomingSize[] }

/**
 * PUT /api/admin/products/[id]/inventory
 * Body: { inventoryByLocation: [{ locationId, sizes: [{ size, quantity }] }] }
 *
 * Any currently-assigned location that is OMITTED from the payload is treated
 * as "removed" and its SizeInventory rows are deleted — unless:
 *   - it's the main store (SEC-110, compat shim dependency) → 409
 *   - any of its rows have heldQuantity > 0 (active holds reference them,
 *     since Hold has no direct locationId, heldQuantity > 0 is the proxy
 *     signal that an active hold currently occupies that inventory) → 409
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'inventory:write')
  if (error) return error

  let body: { inventoryByLocation?: unknown } | null
  try {
    body = await parseJsonBody<{ inventoryByLocation?: unknown }>(req)
  } catch (err) {
    return apiErrorResponse(err)
  }
  if (!body || !Array.isArray(body.inventoryByLocation)) {
    return badRequest('inventoryByLocation array is required')
  }
  const payload = body.inventoryByLocation as IncomingLocationEntry[]

  for (const entry of payload) {
    if (!entry || typeof entry.locationId !== 'string' || !entry.locationId) {
      return badRequest('Each entry requires a valid locationId')
    }
    if (!Array.isArray(entry.sizes)) {
      return badRequest('Each entry requires a sizes array')
    }
    for (const s of entry.sizes) {
      if (typeof s.size !== 'string' || !s.size.trim()) {
        return badRequest('Each size row requires a non-empty size label')
      }
      if (!Number.isInteger(s.quantity) || s.quantity < 0) {
        return badRequest(`Quantity for size "${s.size}" must be a non-negative integer`)
      }
    }
  }

  const product = await prisma.product.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const requestedLocationIds = Array.from(new Set(payload.map((e) => e.locationId)))
  const requestedLocations = await prisma.storeLocation.findMany({
    where: { id: { in: requestedLocationIds } },
    select: { id: true, active: true },
  })
  const requestedLocationsById = new Map(requestedLocations.map((l) => [l.id, l]))
  for (const locId of requestedLocationIds) {
    const loc = requestedLocationsById.get(locId)
    if (!loc || !loc.active) {
      return NextResponse.json(
        { error: `Location ${locId} does not exist or is inactive` },
        { status: 400 }
      )
    }
  }

  const existingRows = await prisma.sizeInventory.findMany({
    where: { productId: params.id },
    select: { locationId: true, size: true, quantity: true, heldQuantity: true, pickedQuantity: true },
  })
  const existingLocationIds = Array.from(new Set(existingRows.map((r) => r.locationId)))
  const newLocationIdSet = new Set(requestedLocationIds)
  const toRemoveLocationIds = existingLocationIds.filter((id) => !newLocationIdSet.has(id))

  if (toRemoveLocationIds.length > 0) {
    const removeLocMeta = await prisma.storeLocation.findMany({
      where: { id: { in: toRemoveLocationIds } },
      select: { id: true, isMainStore: true, name: true },
    })
    for (const loc of removeLocMeta) {
      if (loc.isMainStore) {
        return NextResponse.json(
          {
            error:
              'Cannot remove main store inventory while legacy consumers depend on it — coming in later phase.',
          },
          { status: 409 }
        )
      }
      const hasHeld = existingRows.some((r) => r.locationId === loc.id && r.heldQuantity > 0)
      if (hasHeld) {
        return NextResponse.json(
          { error: `Cannot remove location "${loc.name}" — active holds reference its inventory.` },
          { status: 409 }
        )
      }
    }
  }

  try {
    const existingByKey = new Map(
      existingRows.map((r) => [`${r.locationId}::${r.size}`, r])
    )

    await prisma.$transaction(async (tx) => {
      const { actorId, actorEmail } = await resolveActorFromSession(tx, session)

      // Main Store (Gate 5) is editable through this modal like any other
      // location — it is the single source of truth for replenishment, and
      // the Product Edit modal reads its allocation read-only.
      const filteredPayload = payload

      if (toRemoveLocationIds.length > 0) {
        const removedRows = existingRows.filter((r) => toRemoveLocationIds.includes(r.locationId))
        await tx.sizeInventory.deleteMany({
          where: { productId: params.id, locationId: { in: toRemoveLocationIds } },
        })
        for (const r of removedRows) {
          await logInventoryTransaction(tx, {
            productId: params.id,
            size: r.size,
            type: 'remove',
            quantity: -r.quantity,
            fromLocationId: r.locationId,
            actorId,
            actorEmail,
            note: 'Location unassigned from product',
          })
        }
      }

    for (const entry of filteredPayload) {
      const submittedSizes = new Set(entry.sizes.map((s) => s.size))

      for (const s of entry.sizes) {
        const existing = existingByKey.get(`${entry.locationId}::${s.size}`)
        await tx.sizeInventory.upsert({
          where: {
            productId_size_locationId: {
              productId: params.id,
              size: s.size,
              locationId: entry.locationId,
            },
          },
          update: { quantity: s.quantity },
          create: {
            productId: params.id,
            size: s.size,
            quantity: s.quantity,
            locationId: entry.locationId,
          },
        })

        if (!existing) {
          if (s.quantity !== 0) {
            await logInventoryTransaction(tx, {
              productId: params.id,
              size: s.size,
              type: 'assign',
              quantity: s.quantity,
              toLocationId: entry.locationId,
              actorId,
              actorEmail,
              note: 'Size assigned to location',
            })
          }
        } else if (existing.quantity !== s.quantity) {
          // Distinguish a net-positive change as a replenishment and a
          // net-negative change as a removal so the audit trail is accurate.
          const delta = s.quantity - existing.quantity
          await logInventoryTransaction(tx, {
            productId: params.id,
            size: s.size,
            type: delta > 0 ? 'adjustment' : 'remove',
            quantity: delta,
            toLocationId: delta > 0 ? entry.locationId : null,
            fromLocationId: delta < 0 ? entry.locationId : null,
            actorId,
            actorEmail,
            note: delta > 0 ? `Replenished +${delta}` : `Removed ${Math.abs(delta)}`,
          })
        }
      }

        // Prune size rows that were dropped from this (still-assigned) location's
        // template, but only when safe (no held/picked units tied to them).
        const existingForLoc = existingRows.filter((r) => r.locationId === entry.locationId)
        const sizesToPrune = existingForLoc
          .filter((r) => !submittedSizes.has(r.size) && r.heldQuantity === 0 && r.pickedQuantity === 0)
          .map((r) => r.size)
        if (sizesToPrune.length > 0) {
          await tx.sizeInventory.deleteMany({
            where: { productId: params.id, locationId: entry.locationId, size: { in: sizesToPrune } },
          })
          for (const size of sizesToPrune) {
            const r = existingForLoc.find((row) => row.size === size)!
            await logInventoryTransaction(tx, {
              productId: params.id,
              size,
              type: 'remove',
              quantity: -r.quantity,
              fromLocationId: entry.locationId,
              actorId,
              actorEmail,
              note: 'Size removed from location',
            })
          }
        }
      }

      // Re-sync product-level aggregate totals from all SizeInventory rows
      // so legacy consumers always read the true total.
      await syncProductTotalsFromSizeInventory(tx, params.id)

      // Auto-transition AVAILABLE/SOLD status based on total availability.
      const current = await tx.product.findUnique({ where: { id: params.id }, select: { status: true } })
      if (current && current.status !== 'ARCHIVED') {
        const allRows = await tx.sizeInventory.findMany({
          where: { productId: params.id },
          select: { quantity: true, heldQuantity: true, pickedQuantity: true },
        })
        const remaining = aggregateAvailable(allRows)
        const computedStatus = remaining > 0 ? 'AVAILABLE' : 'SOLD'
        if (current.status !== computedStatus) {
          await tx.product.update({ where: { id: params.id }, data: { status: computedStatus } })
        }
      }
    })
  } catch (err) {
    return apiErrorResponse(err, 'Failed to update inventory')
  }

  // Return refreshed state, same shape as GET
  const [allLocations, freshRows] = await Promise.all([
    prisma.storeLocation.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true, name: true, isMainStore: true, isPickupQueue: true },
    }),
    prisma.sizeInventory.findMany({
      where: { productId: params.id },
      select: {
        locationId: true,
        size: true,
        quantity: true,
        heldQuantity: true,
        pickedQuantity: true,
      },
      orderBy: { size: 'asc' },
    }),
  ])
  const sizesByLocation = new Map<
    string,
    { size: string; quantity: number; heldQuantity: number; pickedQuantity: number }[]
  >()
  for (const row of freshRows) {
    if (!sizesByLocation.has(row.locationId)) sizesByLocation.set(row.locationId, [])
    sizesByLocation.get(row.locationId)!.push({
      size: row.size,
      quantity: row.quantity,
      heldQuantity: row.heldQuantity,
      pickedQuantity: row.pickedQuantity,
    })
  }
  // Enrich PUT response with same per-location aggregate metrics as GET
  const refreshedAvailability = await getProductAvailability(params.id)
  const refreshedBreakdownByLoc = new Map(
    refreshedAvailability.locationBreakdown.map((lb) => [lb.locationId, lb])
  )

  const inventoryByLocation = allLocations.map((loc) => {
    const lb = refreshedBreakdownByLoc.get(loc.id)
    return {
      locationId: loc.id,
      code: loc.code,
      name: loc.name,
      isMainStore: loc.isMainStore,
      isPickupQueue: loc.isPickupQueue,
      assigned: sizesByLocation.has(loc.id),
      sizes: sizesByLocation.get(loc.id) ?? [],
      availableBalance: lb?.available ?? 0,
      soldQuantity: lb?.picked ?? 0,
    }
  })

  return NextResponse.json({
    productId: params.id,
    inventoryByLocation,
    allLocations,
  })
}
