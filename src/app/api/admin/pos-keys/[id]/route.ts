import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/pos-keys/[id]
 * Body: { active: boolean } — revoke (active=false) or reactivate a key.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'pos-keys:manage')
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'active (boolean) is required' }, { status: 400 })
  }

  const existing = await prisma.posApiKey.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 })
  }

  const updated = await prisma.posApiKey.update({
    where: { id: params.id },
    data: { active: body.active },
  })

  const user = session.user as AdminSession['user']
  await recordAudit({
    tx: prisma,
    action: body.active ? 'pos-key.reactivated' : 'pos-key.revoked',
    entityType: 'PosApiKey',
    entityId: params.id,
    actorId: user.adminId,
    actorType: 'admin',
    actorEmail: user.email,
    before: { active: existing.active },
    after: { active: updated.active },
    req,
  })

  return NextResponse.json({
    key: {
      id: updated.id,
      name: updated.name,
      active: updated.active,
    },
  })
}
