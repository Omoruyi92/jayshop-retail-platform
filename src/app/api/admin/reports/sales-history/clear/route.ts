import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Mirrors `getPeriodDates` in `../route.ts` (GET) so the live count and the
// actual delete always target the exact same date window.
function getPeriodDates(period: string, dateFrom?: string | null, dateTo?: string | null) {
  if (dateFrom && dateTo) return { from: new Date(dateFrom), to: new Date(dateTo) }
  const to = new Date()
  const from = new Date()
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7
  from.setDate(from.getDate() - days)
  return { from, to }
}

function buildWhere(params: URLSearchParams | Record<string, string>): Prisma.SalesHistoryWhereInput {
  const get = (key: string): string | null =>
    params instanceof URLSearchParams ? params.get(key) : params[key] ?? null

  const period = get('period') ?? '30d'
  const dateFrom = get('dateFrom')
  const dateTo = get('dateTo')
  const { from, to } = getPeriodDates(period, dateFrom, dateTo)

  return { soldAt: { gte: from, lte: to } }
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'sales-history:delete')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const count = await prisma.salesHistory.count({ where: buildWhere(searchParams) })
  return NextResponse.json({ count })
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'sales-history:delete')
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const scope: 'filtered' | 'all' = body?.scope === 'all' ? 'all' : 'filtered'

  if (scope === 'all' && body?.confirmText !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm clearing all records.' }, { status: 400 })
  }

  const filters = (body?.filters ?? {}) as Record<string, string>
  const where: Prisma.SalesHistoryWhereInput = scope === 'filtered' ? buildWhere(filters) : {}

  const deleted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.salesHistory.deleteMany({ where })
    await recordAudit({
      tx,
      action: 'sales-history.cleared',
      entityType: 'SalesHistory',
      entityId: 'bulk-clear',
      actorId: session.user.adminId,
      actorType: 'admin',
      actorEmail: session.user.email,
      payload: { scope, filters: scope === 'filtered' ? filters : undefined, countDeleted: count },
      req,
    })
    return count
  })

  return NextResponse.json({ deleted })
}
