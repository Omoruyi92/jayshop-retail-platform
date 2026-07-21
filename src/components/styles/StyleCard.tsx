'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export type StyleCardData = {
  id: string
  name: string
  slug: string
  coverImageUrl: string
  coverVideoUrl?: string | null
  productCount: number
}

export default function StyleCard({
  style,
  className = '',
  priority = false,
}: {
  style: StyleCardData
  className?: string
  priority?: boolean
}) {
  return (
    <Link
      href={`/shop-by-style/${style.slug}`}
      className={`group relative block overflow-hidden bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jays-navy/30 ${className}`}
    >
      {style.coverVideoUrl ? (
        <video
          src={style.coverVideoUrl}
          poster={style.coverImageUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
        />
      ) : (
        <Image
          src={style.coverImageUrl}
          alt={style.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
        />
      )}

      {/* Base gradient — keeps the name legible without covering the full
          photo (image no longer fills the tile edge-to-edge, so this only
          needs to shade the bottom strip behind the label). */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-500 group-hover:from-black/80 sm:h-28" />

      {/* Hover overlay reveal — subtle navy wash + border glow for premium feel */}
      <div className="absolute inset-0 bg-jays-navy/0 transition-colors duration-500 group-hover:bg-jays-navy/5" />
      <div className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_0_2px_rgba(11,45,94,0.25)] transition-opacity duration-500 group-hover:opacity-100" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-4 sm:p-5 lg:p-6">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white drop-shadow-md sm:text-xl lg:text-2xl">
            {style.name}
          </h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-blue-100/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:text-sm">
            {style.productCount} {style.productCount === 1 ? 'item' : 'items'} · Shop now
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 translate-y-1 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:bg-white/25 sm:h-10 sm:w-10">
          <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  )
}
