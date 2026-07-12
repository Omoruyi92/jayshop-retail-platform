import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const player = await prisma.player.findFirst({
    where: { slug: params.slug, status: 'ACTIVE' },
    include: {
      products: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: true,
        },
      },
    },
  })

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  const gear = player.products
    .filter((link) => link.product.status !== 'ARCHIVED')
    .map((link) => ({
      linkId: link.id,
      label: link.label,
      product: link.product,
    }))

  return NextResponse.json({
    player: {
      id: player.id,
      name: player.name,
      slug: player.slug,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      bio: player.bio,
      heroImageUrl: player.heroImageUrl,
      imageUrls: player.imageUrls,
      stats: player.stats,
      isFeatured: player.isFeatured,
      isTrending: player.isTrending,
      isNewArrival: player.isNewArrival,
      createdAt: player.createdAt,
    },
    gear,
  })
}
