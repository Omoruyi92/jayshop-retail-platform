import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

export const dynamic = 'force-dynamic'

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Admin: returns ALL categories (active + inactive) with children, for
// management in the admin dashboard.
export async function GET(req: Request) {
  const { error } = await requireRole(req, 'categories:read')
  if (error) return error

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: { orderBy: { sortOrder: 'asc' } },
      productTypes: { orderBy: { sortOrder: 'asc' } },
      categoryBrands: { orderBy: { sortOrder: 'asc' }, include: { brand: true } },
    },
  })

  return NextResponse.json({ categories })
}

// Admin: create a new top-level category or a subcategory (when parentId
// is provided).
export async function POST(req: Request) {
  const { error } = await requireRole(req, 'categories:write')
  if (error) return error

  try {
    const body = await req.json()
    const name = (body.name as string)?.trim()
    const parentId = (body.parentId as string) || null

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const baseSlug = slugify(name)
    let slug = baseSlug
    let n = 1
    while (await prisma.category.findFirst({ where: { parentId, slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    const siblingCount = await prisma.category.count({ where: { parentId } })

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parentId,
        sortOrder: siblingCount,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
