import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'

export const dynamic = 'force-dynamic'

// One-time (but safe-to-rerun) admin cleanup for the `CustomerNotification`
// table. This is a SNAPSHOT table — rows are written once when a product's
// `isNewArrival` flips true -> written by the admin edit endpoint (see
// src/app/api/admin/products/[id]/route.ts) — and are only deleted going
// forward as of commit a5a0da3 (when the flag flips false -> true, or the
// product is archived/deleted). Any `NEW_ARRIVAL` notification created
// *before* that fix shipped was never cleaned up, so it lingers in the
// customer-facing notification bell even though the product itself no
// longer qualifies as a new arrival. There is also no unique constraint on
// (productId, type), so re-toggling isNewArrival true multiple times before
// the fix existed could create duplicate notification rows for the same
// product — this endpoint also dedupes those, keeping the newest row.
//
// GET  -> dry run, returns counts only (no mutation)
// POST -> performs the deletes/dedupe, returns counts of what was removed
export async function GET(req: Request) {
  const { error } = await requireRole(req, 'products:write')
  if (error) return error

  try {
    const result = await computeCleanup()
    return NextResponse.json({ dryRun: true, ...result })
  } catch (err) {
    console.error('[cleanup-stale] Error:', err)
    return NextResponse.json({ error: 'Failed to compute cleanup preview' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireRole(req, 'products:write')
  if (error) return error

  try {
    const { staleIds, duplicateIds } = await computeCleanup()

    const idsToDelete = Array.from(new Set([...staleIds, ...duplicateIds]))

    if (idsToDelete.length > 0) {
      await prisma.customerNotification.deleteMany({
        where: { id: { in: idsToDelete } },
      })
    }

    return NextResponse.json({
      dryRun: false,
      staleDeleted: staleIds.length,
      duplicatesDeleted: duplicateIds.length,
      totalDeleted: idsToDelete.length,
    })
  } catch (err) {
    console.error('[cleanup-stale] Error:', err)
    return NextResponse.json({ error: 'Failed to run cleanup' }, { status: 500 })
  }
}

async function computeCleanup(): Promise<{
  staleIds: string[]
  duplicateIds: string[]
  staleCount: number
  duplicateCount: number
}> {
  const notifications = await prisma.customerNotification.findMany({
    where: { type: 'NEW_ARRIVAL' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, productId: true, createdAt: true },
  })

  const productIds = Array.from(
    new Set(notifications.map((n) => n.productId).filter((id): id is string => Boolean(id)))
  )

  const liveNewArrivalProducts = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds }, isNewArrival: true, status: { not: 'ARCHIVED' } },
        select: { id: true },
      })
    : []
  const liveNewArrivalIds = new Set(liveNewArrivalProducts.map((p) => p.id))

  const staleIds: string[] = []
  const duplicateIds: string[] = []
  const seenLiveProductIds = new Set<string>()

  // notifications is already sorted newest -> oldest, so for genuinely live
  // new-arrival products we keep the first (newest) row seen per productId
  // and mark any further rows for that same product as duplicates.
  for (const n of notifications) {
    if (!n.productId || !liveNewArrivalIds.has(n.productId)) {
      // Product no longer exists, no longer flagged isNewArrival, or archived.
      staleIds.push(n.id)
      continue
    }
    if (seenLiveProductIds.has(n.productId)) {
      duplicateIds.push(n.id)
    } else {
      seenLiveProductIds.add(n.productId)
    }
  }

  return {
    staleIds,
    duplicateIds,
    staleCount: staleIds.length,
    duplicateCount: duplicateIds.length,
  }
}
