import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, type AdminSession } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { error } = await requireRole(req, 'promotions:read')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: { status?: string } = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    const promotions = await prisma.promotionMessage.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ promotions })
  } catch (err) {
    console.error('GET /api/admin/promotions', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole(req, 'promotions:write')
    if (error) return error

    const body = await req.json()
    const text = String(body.text ?? '').trim()
    const link = String(body.link ?? '').trim()
    const priority = Number(body.priority ?? 0)
    const status = String(body.status ?? 'PENDING').trim()
    const startsAt = body.startsAt ? new Date(body.startsAt) : null
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null

    if (!text) {
      return NextResponse.json({ error: 'Promotion text is required' }, { status: 400 })
    }

    const admin = session!.user as AdminSession['user']

    let approvedBy: string | null = null
    let approvedAt: Date | null = null
    if (status === 'APPROVED') {
      approvedBy = admin.adminId
      approvedAt = new Date()
    }

    const promotion = await prisma.promotionMessage.create({
      data: {
        text,
        link,
        priority,
        status,
        startsAt,
        expiresAt,
        approvedBy,
        approvedAt,
        createdBy: admin.adminId,
      },
    })

    await recordAudit({
      tx: prisma,
      action: 'promotion.created',
      entityType: 'PromotionMessage',
      entityId: promotion.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: { text, link, priority, status, startsAt, expiresAt },
      req,
    })

    return NextResponse.json({ promotion }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/promotions', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
