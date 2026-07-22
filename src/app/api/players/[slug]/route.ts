import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Revalidated on-demand via revalidateTag('players') from the admin
// players routes (create/update/delete) plus a 60s fallback TTL — same
// caching approach as GET /api/players.
const getCachedPlayerBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.player.findFirst({
      where: { slug, status: 'ACTIVE' },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          include: {
            // Only select the fields actually rendered on the gear cards
            // (image, name, price, slug, id, featured flag) instead of the
            // full ~20-column Product row.
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
                priceCents: true,
                status: true,
                isFeatured: true,
              },
            },
          },
        },
      },
    })
  },
  ['player-by-slug'],
  { revalidate: 60, tags: ['players'] }
)

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const player = await getCachedPlayerBySlug(params.slug)

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
