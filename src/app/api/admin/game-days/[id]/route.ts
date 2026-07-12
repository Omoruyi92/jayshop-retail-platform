import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'game-days:manage')
  if (error) return error

  try {
    const before = await prisma.gameDay.findUnique({ where: { id: params.id } })
    await prisma.gameDay.delete({ where: { id: params.id } })

    const user = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'game-day.deleted',
      entityType: 'GameDay',
      entityId: params.id,
      actorId: user.adminId,
      actorType: 'admin',
      actorEmail: user.email,
      before: before ? { date: before.date.toISOString(), opponent: before.opponent, note: before.note } : undefined,
      req,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/game-days/:id] DELETE error:', err)
    return NextResponse.json({ error: 'Game day not found' }, { status: 404 })
  }
}
