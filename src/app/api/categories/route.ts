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
    },
  })

  return NextResponse.json({ categories })
}
