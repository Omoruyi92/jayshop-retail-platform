import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public: returns active style categories only, sorted by sortOrder, for
// the "Shop by Style" masonry landing page.
export async function GET() {
  const styles = await prisma.styleCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: true } },
    },
  })

  const shaped = styles.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    coverImageUrl: s.coverImageUrl,
    heroImageUrl: s.heroImageUrl,
    heroVideoUrl: s.heroVideoUrl,
    heroOverlayText: s.heroOverlayText,
    heroCtaLabel: s.heroCtaLabel,
    heroCtaUrl: s.heroCtaUrl,
    sortOrder: s.sortOrder,
    productCount: s._count.products,
  }))

  return NextResponse.json({ styles: shaped })
}
