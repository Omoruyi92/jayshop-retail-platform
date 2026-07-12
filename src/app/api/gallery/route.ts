import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  const images = await prisma.storeGalleryImage.findMany({
    where: {
      status: 'ACTIVE',
      ...(category ? { category } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  const categories = await prisma.storeGalleryImage.groupBy({
    by: ['category'],
    where: { status: 'ACTIVE' },
    _count: { category: true },
  })

  return NextResponse.json({
    images,
    categories: categories.map((c) => ({
      name: c.category,
      count: c._count.category,
    })),
  })
}
