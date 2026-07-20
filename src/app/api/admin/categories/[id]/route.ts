import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

export const dynamic = 'force-dynamic'

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'categories:write')
  if (error) return error

  try {
    const body = await req.json()
    const category = await prisma.category.findUnique({ where: { id: params.id } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Move up/down: swap sortOrder with the adjacent sibling.
    if (body.move === 'up' || body.move === 'down') {
      const siblings = await prisma.category.findMany({
        where: { parentId: category.parentId },
        orderBy: { sortOrder: 'asc' },
      })
      const idx = siblings.findIndex((s) => s.id === category.id)
      const swapIdx = body.move === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= siblings.length) {
        return NextResponse.json({ category })
      }
      const other = siblings[swapIdx]
      await prisma.$transaction([
        prisma.category.update({ where: { id: category.id }, data: { sortOrder: other.sortOrder } }),
        prisma.category.update({ where: { id: other.id }, data: { sortOrder: category.sortOrder } }),
      ])
      const updated = await prisma.category.findUnique({ where: { id: category.id } })
      return NextResponse.json({ category: updated })
    }

    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) {
      data.name = body.name.trim()
      const baseSlug = slugify(body.name)
      if (baseSlug && baseSlug !== category.slug) {
        let slug = baseSlug
        let n = 1
        while (await prisma.category.findFirst({ where: { parentId: category.parentId, slug, id: { not: category.id } } })) {
          slug = `${baseSlug}-${n++}`
        }
        data.slug = slug
      }
    }
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder
    if (body.sortPriority === null || typeof body.sortPriority === 'number') data.sortPriority = body.sortPriority

    const updated = await prisma.category.update({ where: { id: category.id }, data })
    return NextResponse.json({ category: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'categories:write')
  if (error) return error

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: { children: true },
  })
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }
  if (category.children.length > 0) {
    return NextResponse.json({ error: 'Remove or reassign subcategories first' }, { status: 400 })
  }

  const productCount = category.parentId
    ? await prisma.product.count({ where: { subcategory: category.slug } })
    : await prisma.product.count({ where: { category: category.slug } })

  if (productCount > 0) {
    return NextResponse.json(
      { error: `${productCount} product(s) still use this category. Deactivate it instead of deleting.` },
      { status: 400 }
    )
  }

  await prisma.category.delete({ where: { id: category.id } })
  return NextResponse.json({ success: true })
}
