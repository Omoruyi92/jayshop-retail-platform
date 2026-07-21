import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/pos-events?type=sale&status=applied&locationId=...&limit=50
 * Filterable list of PosEvent rows for the admin viewer, cross-linked to
 * the InventoryTransaction rows created by each event (matched via the
 * `externalId=<id>` note convention used in /api/pos/transaction).
 */
export async function GET(req: Request) {
  const { error } = await requireRole(req, 'pos-events:read')
  if (error) return error

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const status = url.searchParams.get('status')
  const locationId = url.searchParams.get('locationId')
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200)

  const where: Prisma.PosEventWhereInput = {}
  if (type) where.type = type
  if (status) where.status = status
  if (locationId) where.locationId = locationId

  const events = await prisma.posEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      apiKey: { select: { id: true, name: true } },
    },
  })

  const eventsWithLocation = await Promise.all(
    events.map(async (e) => {
      const location = e.locationId
        ? await prisma.storeLocation.findUnique({ where: { id: e.locationId }, select: { code: true, name: true } })
        : null
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { note: `externalId=${e.externalId}` },
        select: { id: true, productId: true, size: true, type: true, quantity: true, createdAt: true },
      })
      return { ...e, location, transactions }
    })
  )

  return NextResponse.json({ events: eventsWithLocation })
}
