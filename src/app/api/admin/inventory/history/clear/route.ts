import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Mirrors the where-builder in `../route.ts` (GET) so the live count and the
// actual delete always target the exact same rows.
function buildWhere(params: URLSearchParams | Record<string, string>): Prisma.InventoryTransactionWhereInput {
  const get = (key: string): string | null =>
    params instanceof URLSearchParams ? params.get(key) : params[key] ?? null

  const productId = get('productId')
  const locationId = get('locationId')
  const typeParam = get('type')
  const from = get('from')
  const to = get('to')

  const types = typeParam
    ? typeParam.split(',').map((t) => t.trim()).filter(Boolean)
    : undefined

  const createdAtFilter = (from || to)
    ? { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) }
    : undefined

  return {
    ...(productId ? { productId } : {}),
    ...(types && types.length > 0 ? { type: { in: types } } : {}),
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    ...(locationId ? { OR: [{ fromLocationId: locationId }, { toLocationId: locationId }] } : {}),
  }
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'inventory-history:delete')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const count = await prisma.inventoryTransaction.count({ where: buildWhere(searchParams) })
  return NextResponse.json({ count })
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'inventory-history:delete')
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const scope: 'filtered' | 'all' = body?.scope === 'all' ? 'all' : 'filtered'

  if (scope === 'all' && body?.confirmText !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm clearing all records.' }, { status: 400 })
  }

  const filters = (body?.filters ?? {}) as Record<string, string>
  const where: Prisma.InventoryTransactionWhereInput = scope === 'filtered' ? buildWhere(filters) : {}

  const deleted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.inventoryTransaction.deleteMany({ where })
    await recordAudit({
      tx,
      action: 'inventory-history.cleared',
      entityType: 'InventoryTransaction',
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
