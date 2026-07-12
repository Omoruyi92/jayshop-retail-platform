import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/inventory/history
 * Query params: productId?, locationId?, type?, from?, to?, limit? (default 50), cursor?
 * `locationId` matches either fromLocationId or toLocationId.
 * `type` accepts a single type or a comma-separated list for multi-select filters.
 * Cursor is the `id` of the last row from the previous page (createdAt desc order).
 */
export async function GET(req: Request) {
  const { error } = await requireRole(req, 'inventory:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const locationId = searchParams.get('locationId')
  const typeParam = searchParams.get('type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 200)

  const types = typeParam
    ? typeParam.split(',').map((t) => t.trim()).filter(Boolean)
    : undefined

  const createdAtFilter =
    from || to
      ? {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to ? { lte: new Date(to) } : {}),
        }
      : undefined

  const where: Prisma.InventoryTransactionWhereInput = {
    ...(productId ? { productId } : {}),
    ...(types && types.length > 0 ? { type: { in: types } } : {}),
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    ...(locationId
      ? { OR: [{ fromLocationId: locationId }, { toLocationId: locationId }] }
      : {}),
  }

  const rows = await prisma.inventoryTransaction.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, slug: true } },
      fromLocation: { select: { id: true, code: true, name: true } },
      toLocation: { select: { id: true, code: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  })

  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null

  return NextResponse.json({
    rows: pageRows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      type: r.type,
      quantity: r.quantity,
      size: r.size,
      note: r.note,
      actorEmail: r.actorEmail,
      product: r.product,
      fromLocation: r.fromLocation,
      toLocation: r.toLocation,
    })),
    nextCursor,
    hasMore,
  })
}
