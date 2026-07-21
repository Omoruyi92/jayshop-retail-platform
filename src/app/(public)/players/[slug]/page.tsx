'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import PlayerBadge from '@/components/players/PlayerBadge'
import ProductImageGallery from '@/components/shop/ProductImageGallery'

type GearProduct = {
  id: string
  name: string
  slug: string
  imageUrl: string
  priceCents: number
  color: string
  isFeatured: boolean
}

type GearLink = {
  linkId: string
  label: string
  product: GearProduct
}

type PlayerDetail = {
  id: string
  name: string
  slug: string
  jerseyNumber: string
  position: string
  bio: string
  heroImageUrl: string
  imageUrls: string
  isFeatured: boolean
  isTrending: boolean
  isNewArrival: boolean
  stats: Record<string, string | number> | null
}

export default function PlayerDetailPage() {
  const params = useParams<{ slug: string }>()
  const [player, setPlayer] = useState<PlayerDetail | null>(null)
  const [gear, setGear] = useState<GearLink[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/players/${params.slug}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true)
          return
        }
        const data = await res.json()
        if (!cancelled) {
          setPlayer(data.player)
          setGear(data.gear ?? [])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [params.slug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="aspect-[4/3] rounded-2xl bg-jays-ice mb-6" />
        <div className="h-6 w-1/2 bg-jays-ice rounded mb-3" />
        <div className="h-4 w-full bg-jays-ice rounded mb-2" />
        <div className="h-4 w-2/3 bg-jays-ice rounded" />
      </div>
    )
  }

  if (notFound || !player) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-jays-navy">Player not found</p>
        <Link href="/players" className="text-jays-royal underline text-sm mt-2 inline-block">
          Back to Popular Players
        </Link>
      </div>
    )
  }

  const bundleIds = gear.map((g) => g.product.id).join(',')
  const featuredGearIds = gear.filter((g) => g.product.isFeatured).map((g) => g.product.id).join(',')
  const galleryImages = [
    player.heroImageUrl,
    ...(player.imageUrls ? player.imageUrls.split(',').map((s) => s.trim()).filter(Boolean) : []),
  ].filter((url, i, arr) => Boolean(url) && arr.indexOf(url) === i)

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

      {player.stats && Object.keys(player.stats).length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6">
          {Object.entries(player.stats).map(([key, value]) => (
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
            {gear.map((g) => (
              <Link
                key={g.linkId}
                href={`/shop/${g.product.slug}`}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-jays-ice">
                  <Image
                    src={g.product.imageUrl}
                    alt={g.product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-jays-navy truncate">{g.label || g.product.name}</p>
                  <p className="text-xs font-bold text-jays-red">${(g.product.priceCents / 100).toFixed(2)}</p>
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
