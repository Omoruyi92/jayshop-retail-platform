import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

export const dynamic = 'force-dynamic'

// Assign an existing global Brand to a top-level category.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'categories:write')
  if (error) return error

  try {
    const body = await req.json()
    const brandId = (body.brandId as string)?.trim()
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: params.id } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const brand = await prisma.brand.findUnique({ where: { id: brandId } })
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const existing = await prisma.categoryBrand.findUnique({
      where: { categoryId_brandId: { categoryId: category.id, brandId: brand.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Brand already assigned to this category' }, { status: 400 })
    }

    const maxOrder = await prisma.categoryBrand.aggregate({
      where: { categoryId: category.id },
      _max: { sortOrder: true },
    })

    const categoryBrand = await prisma.categoryBrand.create({
      data: {
        categoryId: category.id,
        brandId: brand.id,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: { brand: true },
    })

    return NextResponse.json({ categoryBrand }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
