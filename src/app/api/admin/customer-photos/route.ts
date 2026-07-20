import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { session, error } = await requireRole(req, 'reviews:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'PENDING'
  const productId = searchParams.get('productId')

  const where: any = { status }
  if (productId) where.productId = productId

  const photos = await prisma.customerPhoto.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { id: true, name: true, slug: true, imageUrl: true } } },
  })

  return NextResponse.json(photos)
}

export async function PATCH(req: Request) {
  const { session, error } = await requireRole(req, 'reviews:write')
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const { id, status } = body

  if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const photo = await prisma.customerPhoto.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(photo)
}

export async function DELETE(req: Request) {
  const { session, error } = await requireRole(req, 'reviews:write')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }

  await prisma.customerPhoto.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
