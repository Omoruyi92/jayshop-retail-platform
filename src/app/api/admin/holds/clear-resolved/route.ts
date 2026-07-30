import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Mirrors the phone/code/date filters from `../route.ts` (GET), but ALWAYS
// force-injects `status: { not: 'ACTIVE' }` — this key is never derived from
// client input, so an ACTIVE hold can never be deleted via this control no
// matter what scope/filters the client sends.
function buildWhere(params: URLSearchParams | Record<string, string>): Prisma.HoldWhereInput {
  const get = (key: string): string | null =>
    params instanceof URLSearchParams ? params.get(key) : params[key] ?? null

  const phone = get('phone')
  const code = get('code')
  const dateFrom = get('dateFrom')
  const dateTo = get('dateTo')

  const placedAtFilter = (dateFrom || dateTo)
    ? { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) }
    : undefined

  return {
    status: { not: 'ACTIVE' },
    ...(phone ? { customer: { phone: { contains: phone } } } : {}),
    ...(code ? { reservationCode: { contains: code } } : {}),
    ...(placedAtFilter ? { placedAt: placedAtFilter } : {}),
  }
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'holds:clear-resolved')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const count = await prisma.hold.count({ where: buildWhere(searchParams) })
  return NextResponse.json({ count })
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'holds:clear-resolved')
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const scope: 'filtered' | 'all' = body?.scope === 'all' ? 'all' : 'filtered'

  if (scope === 'all' && body?.confirmText !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm clearing all resolved holds.' }, { status: 400 })
  }

  const filters = (body?.filters ?? {}) as Record<string, string>
  // scope 'all' only means "ignore phone/code/date filters" — buildWhere({})
  // still forces status: { not: 'ACTIVE' }, so ACTIVE holds stay protected either way.
  const where: Prisma.HoldWhereInput = scope === 'filtered' ? buildWhere(filters) : buildWhere({})

  const deleted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.hold.deleteMany({ where })
    await recordAudit({
      tx,
      action: 'holds.resolved-cleared',
      entityType: 'Hold',
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
