import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public: returns active categories with their active subcategories,
// ordered for storefront display. Consumed by the shop filters,
// category navigation, and admin product forms.
export async function GET() {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      productTypes: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      categoryBrands: {
        orderBy: { sortOrder: 'asc' },
        include: { brand: true },
      },
    },
  })

  const shaped = categories.map((c) => ({
    ...c,
    productTypes: c.productTypes.map((pt) => ({ name: pt.name, slug: pt.slug })),
    brands: c.categoryBrands
      .filter((cb) => cb.brand.status === 'ACTIVE')
      .map((cb) => ({ name: cb.brand.name, slug: cb.brand.slug, imageUrl: cb.brand.imageUrl })),
  }))

  return NextResponse.json({ categories: shaped })
}
