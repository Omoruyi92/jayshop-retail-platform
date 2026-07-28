import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PlayerBadge from '@/components/players/PlayerBadge'
import ProductImageGallery from '@/components/shop/ProductImageGallery'

// ISR: same 60s TTL as GET /api/players/[slug] and /players — busted
// on-demand via revalidatePath('/players/[slug]') from the admin players
// mutation routes, so admin edits still show up promptly.
export const revalidate = 60

async function getPlayer(slug: string) {
  const player = await prisma.player.findFirst({
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

  return player
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const player = await getPlayer(params.slug)
  if (!player) return { title: 'Player Not Found' }
  return { title: player.name }
}

export default async function PlayerDetailPage({ params }: { params: { slug: string } }) {
  const player = await getPlayer(params.slug)

  if (!player) notFound()

  const gear = player.products
    .filter((link) => link.product.status !== 'ARCHIVED')
    .map((link) => ({
      linkId: link.id,
      label: link.label,
      product: link.product,
    }))

  const bundleIds = gear.map((g) => g.product.id).join(',')
  const featuredGearIds = gear.filter((g) => g.product.isFeatured).map((g) => g.product.id).join(',')
  const galleryImages = [
    player.heroImageUrl,
    ...(player.imageUrls ? player.imageUrls.split(',').map((s) => s.trim()).filter(Boolean) : []),
  ].filter((url, i, arr) => Boolean(url) && arr.indexOf(url) === i)

  const stats = player.stats as Record<string, string | number> | null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-36 sm:pb-10">
      <Link href="/players" className="inline-flex items-center gap-1 text-xs text-jays-royal font-semibold mb-4">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Popular Players
      </Link>

      <div
        className="relative aspect-[4/3] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-jays-ice mb-6"
        style={{ position: 'relative' }}
      >
        <ProductImageGallery images={galleryImages} alt={player.name} />
        <PlayerBadge
          isFeatured={player.isFeatured}
          isTrending={player.isTrending}
          isNewArrival={player.isNewArrival}
          className="absolute top-3 left-3 z-20"
        />
      </div>

      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-jays-navy">{player.name}</h1>
          <p className="text-sm text-gray-500 uppercase tracking-wide mt-0.5">{player.position}</p>
        </div>
        {player.jerseyNumber && (
          <span className="shrink-0 bg-jays-navy text-white font-display font-bold text-xl w-12 h-12 rounded-full flex items-center justify-center shadow-md">
            {player.jerseyNumber}
          </span>
        )}
      </div>

      {player.bio && <p className="text-sm text-gray-700 leading-relaxed mt-3">{player.bio}</p>}

      {stats && Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-jays-ice rounded-xl p-3 text-center">
              <p className="text-lg font-display font-bold text-jays-navy">{String(value)}</p>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">{key}</p>
            </div>
          ))}
        </div>
      )}

      {gear.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display font-bold text-jays-navy text-lg mb-3">Featured Gear</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gear.map((g, index) => (
              <Link
                key={g.linkId}
                href={`/shop/${g.product.slug}`}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-colors hover:border-gray-300"
              >
                <div className="relative aspect-square bg-white">
                  <Image
                    src={g.product.imageUrl}
                    alt={g.product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    priority={index === 0}
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-jays-navy truncate">{g.label || g.product.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Desktop / inline CTAs */}
      <div className="hidden sm:flex gap-3 mt-8">
        {gear.length > 0 && (
          <Link
            href={`/shop?productIds=${bundleIds}&player=${encodeURIComponent(player.name)}`}
            className="flex-1 text-center bg-jays-royal hover:bg-jays-navy text-white font-semibold text-sm rounded-full px-6 py-3 transition-colors"
          >
            Let&apos;s Go
          </Link>
        )}
        {featuredGearIds.length > 0 && (
          <Link
            href={`/shop?productIds=${featuredGearIds}&player=${encodeURIComponent(player.name)}`}
            className="flex-1 text-center bg-jays-navy hover:bg-jays-royal text-white font-semibold text-sm rounded-full px-6 py-3 transition-colors"
          >
            Shop Full Look
          </Link>
        )}
      </div>

      {/* Mobile sticky bottom CTA — sits above the fixed BottomNav (z-40) */}
      {gear.length > 0 && (
        <div className="sm:hidden fixed bottom-16 inset-x-0 z-50 bg-white border-t border-gray-100 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <Link
            href={`/shop?productIds=${bundleIds}&player=${encodeURIComponent(player.name)}`}
            className="block text-center bg-jays-royal hover:bg-jays-navy text-white font-bold text-sm rounded-full px-6 py-3 transition-colors"
          >
            Let&apos;s Go
          </Link>
        </div>
      )}
    </div>
  )
}
