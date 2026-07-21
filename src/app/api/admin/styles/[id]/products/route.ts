import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Admin: assign a product to a style category.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'styles:write')
  if (error) return error

  try {
    const body = await req.json()
    const productId = body.productId as string
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const style = await prisma.styleCategory.findUnique({ where: { id: params.id } })
    if (!style) {
      return NextResponse.json({ error: 'Style category not found' }, { status: 404 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const existing = await prisma.productStyle.findUnique({
      where: { productId_styleCategoryId: { productId, styleCategoryId: params.id } },
    })
    if (existing) {
      return NextResponse.json({ productStyle: existing }, { status: 200 })
    }

    const count = await prisma.productStyle.count({ where: { styleCategoryId: params.id } })

    const productStyle = await prisma.productStyle.create({
      data: {
        productId,
        styleCategoryId: params.id,
        sortOrder: count,
      },
    })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'style-category.product-assigned',
      entityType: 'StyleCategory',
      entityId: params.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: { productId },
      req,
    })

    return NextResponse.json({ productStyle }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin: unassign a product from a style category.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'styles:write')
  if (error) return error

  try {
    const body = await req.json()
    const productId = body.productId as string
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const existing = await prisma.productStyle.findUnique({
      where: { productId_styleCategoryId: { productId, styleCategoryId: params.id } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Product is not assigned to this style' }, { status: 404 })
    }

    await prisma.productStyle.delete({ where: { id: existing.id } })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'style-category.product-unassigned',
      entityType: 'StyleCategory',
      entityId: params.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: { productId },
      req,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
