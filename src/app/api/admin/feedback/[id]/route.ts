export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

function validStatus(status: unknown): status is 'PENDING' | 'APPROVED' | 'REJECTED' {
  return typeof status === 'string' && VALID_STATUSES.includes(status)
}

// PATCH /api/admin/feedback/[id] — approve or reject site feedback
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole(req, 'feedback:write')
  if (error) return error

  const id = params.id
  const { status } = await req.json()

  if (!validStatus(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await prisma.siteFeedback.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  const previousStatus = existing.status

  const updated = await prisma.siteFeedback.update({
    where: { id },
    data: {
      status,
      moderatedBy: session.user.email,
      moderatedAt: new Date(),
    },
  })

  await recordAudit({
    tx: prisma,
    action: status === 'APPROVED' ? 'feedback.approved' : 'feedback.rejected',
    entityType: 'SiteFeedback',
    entityId: id,
    actorId: session.user.adminId,
    actorType: 'admin',
    actorEmail: session.user.email,
    before: { status: previousStatus },
    after: { status },
    req,
  })

  return NextResponse.json({ feedback: updated })
}

// DELETE /api/admin/feedback/[id] — remove site feedback
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole(req, 'feedback:write')
  if (error) return error

  const id = params.id

  const existing = await prisma.siteFeedback.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  await prisma.siteFeedback.delete({ where: { id } })

  await recordAudit({
    tx: prisma,
    action: 'feedback.deleted',
    entityType: 'SiteFeedback',
    entityId: id,
    actorId: session.user.adminId,
    actorType: 'admin',
    actorEmail: session.user.email,
    before: { name: existing.name, message: existing.message, status: existing.status },
    after: null,
    req,
  })

  return NextResponse.json({ success: true })
}
