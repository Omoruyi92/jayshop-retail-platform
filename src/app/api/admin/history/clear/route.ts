import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Mirrors the where-builder in `../route.ts` (GET) so the live count and the
// actual delete always target the exact same rows.
function buildWhere(params: URLSearchParams | Record<string, string>): Prisma.HoldHistoryWhereInput {
  const get = (key: string): string | null =>
    params instanceof URLSearchParams ? params.get(key) : params[key] ?? null

  const dateFrom = get('dateFrom')
  const dateTo = get('dateTo')
  const finalStatus = get('finalStatus')
  const phone = get('phone')
  const product = get('product')
  const adminId = get('adminId')
  const showArchived = get('showArchived') === 'true'

  const resolvedAtFilter = (dateFrom || dateTo)
    ? { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) }
    : undefined

  return {
    ...(!showArchived ? { archivedAt: null } : {}),
    ...(finalStatus ? { finalStatus } : {}),
    ...(phone ? { customerPhoneSnapshot: { contains: phone } } : {}),
    ...(product ? { productNameSnapshot: { contains: product } } : {}),
    ...(adminId ? { resolvedByAdminId: adminId } : {}),
    ...(resolvedAtFilter ? { resolvedAt: resolvedAtFilter } : {}),
  }
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'history:delete')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const count = await prisma.holdHistory.count({ where: buildWhere(searchParams) })
  return NextResponse.json({ count })
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'history:delete')
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const scope: 'filtered' | 'all' = body?.scope === 'all' ? 'all' : 'filtered'

  if (scope === 'all' && body?.confirmText !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm clearing all records.' }, { status: 400 })
  }

  const filters = (body?.filters ?? {}) as Record<string, string>
  const where: Prisma.HoldHistoryWhereInput = scope === 'filtered' ? buildWhere(filters) : {}

  const deleted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.holdHistory.deleteMany({ where })
    await recordAudit({
      tx,
      action: 'history.cleared',
      entityType: 'HoldHistory',
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
