import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'

export const dynamic = 'force-dynamic'

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'categories:write')
  if (error) return error

  try {
    const body = await req.json()
    const existing = await prisma.categoryProductType.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product type not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim()
      const baseSlug = slugify(body.name)
      if (baseSlug && baseSlug !== existing.slug) {
        let slug = baseSlug
        let n = 1
        while (
          await prisma.categoryProductType.findFirst({
            where: { categoryId: existing.categoryId, slug, id: { not: existing.id } },
          })
        ) {
          slug = `${baseSlug}-${n++}`
        }
        data.slug = slug
      }
    }
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder

    const productType = await prisma.categoryProductType.update({ where: { id: existing.id }, data })
    return NextResponse.json({ productType })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'categories:write')
  if (error) return error

  const existing = await prisma.categoryProductType.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Product type not found' }, { status: 404 })
  }

  await prisma.categoryProductType.delete({ where: { id: existing.id } })
  return NextResponse.json({ success: true })
}
