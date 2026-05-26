import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth'

export async function GET(req: Request) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const dateFrom   = searchParams.get('dateFrom')
  const dateTo     = searchParams.get('dateTo')
  const finalStatus = searchParams.get('finalStatus')
  const phone      = searchParams.get('phone')
  const product    = searchParams.get('product')
  const adminId    = searchParams.get('adminId')
  const showArchived = searchParams.get('showArchived') === 'true'
  const page  = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const skip  = (page - 1) * limit

  const resolvedAtFilter = (dateFrom || dateTo)
    ? { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) }
    : undefined

  const where = {
    ...(!showArchived ? { archivedAt: null } : {}),
    ...(finalStatus ? { finalStatus } : {}),
    ...(phone ? { customerPhoneSnapshot: { contains: phone } } : {}),
    ...(product ? { productNameSnapshot: { contains: product } } : {}),
    ...(adminId ? { resolvedByAdminId: adminId } : {}),
    ...(resolvedAtFilter ? { resolvedAt: resolvedAtFilter } : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.holdHistory.findMany({
      where,
      include: { resolvedBy: { select: { email: true } } },
      orderBy: { resolvedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.holdHistory.count({ where }),
  ])

  // Normalise: expose finalTotalCents and fulfilledQuantity (may not exist in older DB rows)
  const normalised = rows.map((r) => ({
    ...r,
    finalTotalCents: (r as Record<string, unknown>).finalTotalCents as number | null ?? null,
    fulfilledQuantity: (r as Record<string, unknown>).fulfilledQuantity as number | null ?? null,
  }))

  return NextResponse.json({ rows: normalised, total, page, limit })
}
