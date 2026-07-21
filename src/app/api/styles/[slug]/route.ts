import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public: returns one active style category with its full assigned
// product list, for the style-filtered listing page.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const style = await prisma.styleCategory.findFirst({
    where: { slug: params.slug, isActive: true },
    include: {
      products: {
        orderBy: { sortOrder: 'asc' },
        include: { product: true },
      },
    },
  })

  if (!style) {
    return NextResponse.json({ error: 'Style not found' }, { status: 404 })
  }

  const products = style.products
    .filter((link) => link.product.status !== 'ARCHIVED')
    .map((link) => link.product)

  return NextResponse.json({
    style: {
      id: style.id,
      name: style.name,
      slug: style.slug,
      description: style.description,
      coverImageUrl: style.coverImageUrl,
      heroImageUrl: style.heroImageUrl,
      heroVideoUrl: style.heroVideoUrl,
      heroOverlayText: style.heroOverlayText,
      heroCtaLabel: style.heroCtaLabel,
      heroCtaUrl: style.heroCtaUrl,
      createdAt: style.createdAt,
    },
    products,
  })
}
