import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'
import { parseJsonBody, apiErrorResponse, badRequest } from '@/lib/api/request'

export const dynamic = 'force-dynamic'

// Admin: assign a product to a style category.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'styles:write')
  if (error) return error

  try {
    const body = await parseJsonBody<{ productId?: string }>(req)
    const productId = body.productId as string
    if (!productId) {
      return badRequest('productId is required')
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

    revalidatePath('/shop-by-style')
    revalidatePath(`/shop-by-style/${style.slug}`)

    return NextResponse.json({ productStyle }, { status: 201 })
  } catch (err) {
    return apiErrorResponse(err)
  }
}

// Admin: unassign a product from a style category.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'styles:write')
  if (error) return error

  try {
    const body = await parseJsonBody<{ productId?: string }>(req)
    const productId = body.productId as string
    if (!productId) {
      return badRequest('productId is required')
    }

    const existing = await prisma.productStyle.findUnique({
      where: { productId_styleCategoryId: { productId, styleCategoryId: params.id } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Product is not assigned to this style' }, { status: 404 })
    }

    const style = await prisma.styleCategory.findUnique({ where: { id: params.id } })

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

    revalidatePath('/shop-by-style')
    if (style) revalidatePath(`/shop-by-style/${style.slug}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
