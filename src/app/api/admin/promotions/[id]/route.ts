import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, type AdminSession } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { session, error } = await requireRole(req, 'promotions:write')
    if (error) return error

    const existing = await prisma.promotionMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    const body = await req.json()
    const text = body.text !== undefined ? String(body.text).trim() : undefined
    const link = body.link !== undefined ? String(body.link).trim() : undefined
    const priority = body.priority !== undefined ? Number(body.priority) : undefined
    const status = body.status !== undefined ? String(body.status).trim() : undefined
    const startsAt = body.startsAt !== undefined ? (body.startsAt ? new Date(body.startsAt) : null) : undefined
    const expiresAt = body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined

    if (text !== undefined && !text) {
      return NextResponse.json({ error: 'Promotion text is required' }, { status: 400 })
    }

    const admin = session!.user as AdminSession['user']

    const updateData: Record<string, unknown> = {}
    if (text !== undefined) updateData.text = text
    if (link !== undefined) updateData.link = link
    if (priority !== undefined) updateData.priority = priority
    if (startsAt !== undefined) updateData.startsAt = startsAt
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt

    if (status !== undefined) {
      updateData.status = status
      if (status === 'APPROVED' && existing.status !== 'APPROVED') {
        updateData.approvedBy = admin.adminId
        updateData.approvedAt = new Date()
      } else if (status !== 'APPROVED') {
        updateData.approvedBy = null
        updateData.approvedAt = null
      }
    }

    const promotion = await prisma.promotionMessage.update({
      where: { id },
      data: updateData,
    })

    await recordAudit({
      tx: prisma,
      action: 'promotion.updated',
      entityType: 'PromotionMessage',
      entityId: promotion.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: existing,
      after: promotion,
      req,
    })

    return NextResponse.json({ promotion })
  } catch (err) {
    console.error('PATCH /api/admin/promotions/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { session, error } = await requireRole(req, 'promotions:write')
    if (error) return error

    const existing = await prisma.promotionMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const permanent = searchParams.get('permanent') === 'true'
    const admin = session!.user as AdminSession['user']

    if (permanent) {
      await prisma.promotionMessage.delete({ where: { id } })

      await recordAudit({
        tx: prisma,
        action: 'promotion.deleted',
        entityType: 'PromotionMessage',
        entityId: id,
        actorId: admin.adminId,
        actorType: 'admin',
        actorEmail: admin.email,
        before: existing,
        req,
      })

      return NextResponse.json({ success: true, deleted: true })
    }

    await prisma.promotionMessage.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    await recordAudit({
      tx: prisma,
      action: 'promotion.archived',
      entityType: 'PromotionMessage',
      entityId: id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: existing,
      after: { status: 'ARCHIVED' },
      req,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/promotions/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
