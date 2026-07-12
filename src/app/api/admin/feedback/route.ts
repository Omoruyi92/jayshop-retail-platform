export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

// GET /api/admin/feedback — list all submitted feedback (optionally filtered by status)
export async function GET(req: NextRequest) {
  const { error } = await requireRole(req, 'feedback:read')
  if (error) return error

  const statusFilter = req.nextUrl.searchParams.get('status') ?? undefined
  const where = statusFilter && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter)
    ? { status: statusFilter }
    : {}

  const [feedback, counts] = await Promise.all([
    prisma.siteFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.siteFeedback.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count.status]))

  return NextResponse.json({
    feedback,
    total: feedback.length,
    pendingCount: countMap['PENDING'] ?? 0,
    approvedCount: countMap['APPROVED'] ?? 0,
    rejectedCount: countMap['REJECTED'] ?? 0,
  })
}
