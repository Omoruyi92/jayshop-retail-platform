import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'admin:manage')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const action      = searchParams.get('action') || undefined
  const entityType  = searchParams.get('entityType') || undefined
  const entityId    = searchParams.get('entityId') || undefined
  const actorEmail  = searchParams.get('actorEmail') || undefined
  const cursor      = searchParams.get('cursor') || undefined
  const limit       = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
    ...(actorEmail ? { actorEmail: { contains: actorEmail, mode: 'insensitive' } } : {}),
  }

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    include: { actor: { select: { email: true } } },
  })

  const hasMore = rows.length > limit
  const trimmed = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? trimmed[trimmed.length - 1]?.id : null

  return NextResponse.json({ rows: trimmed, nextCursor, limit })
}
