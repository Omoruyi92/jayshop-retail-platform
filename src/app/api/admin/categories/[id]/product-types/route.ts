import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

export const dynamic = 'force-dynamic'

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Create a new Type option (e.g. "Jerseys") for a top-level category.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'categories:write')
  if (error) return error

  try {
    const body = await req.json()
    const name = (body.name as string)?.trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: params.id } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const baseSlug = slugify(name)
    let slug = baseSlug
    let n = 1
    while (await prisma.categoryProductType.findFirst({ where: { categoryId: category.id, slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    const maxOrder = await prisma.categoryProductType.aggregate({
      where: { categoryId: category.id },
      _max: { sortOrder: true },
    })

    const productType = await prisma.categoryProductType.create({
      data: {
        categoryId: category.id,
        name,
        slug,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    return NextResponse.json({ productType }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
