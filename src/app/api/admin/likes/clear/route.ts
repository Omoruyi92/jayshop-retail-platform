import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Owner-only destructive clear of ALL fan likes. Mirrors the clear-history
// endpoints: GET returns a live count for the confirmation modal, POST
// requires typing DELETE and writes an audit entry inside the same
// transaction as the delete.

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'likes:clear')
  if (error) return error

  const count = await prisma.productLike.count()
  return NextResponse.json({ count })
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'likes:clear')
  if (error) return error

  const body = await req.json().catch(() => ({}))
  if (body?.confirmText !== 'DELETE') {
    return NextResponse.json({ error: 'Type DELETE to confirm clearing all likes.' }, { status: 400 })
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const { count } = await tx.productLike.deleteMany({})
    await recordAudit({
      tx,
      action: 'likes.cleared',
      entityType: 'ProductLike',
      entityId: 'bulk-clear',
      actorId: session.user.adminId,
      actorType: 'admin',
      actorEmail: session.user.email,
      payload: { countDeleted: count },
      req,
    })
    return count
  })

  return NextResponse.json({ deleted })
}
