'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Images } from 'lucide-react'
import type { GalleryHeroImageData } from '@/lib/gallery/getGalleryHeroImages'

// Standalone hero section for the public Gallery page. Deliberately built
// as a new, independent component — does NOT reuse or touch
// HeroSlideshow.tsx / HomeHero / ShopHero / StylesHero / PlayersHero, which
// are stability-critical and out of scope for this feature.
//
// CLS safety: the outer wrapper always renders at a fixed aspect-ratio
// (reserved via Tailwind `aspect-[...]` classes) regardless of whether
// there are 0, 1, or many images, and regardless of client JS load timing —
// so there is never a layout shift once data arrives or the rotation timer
// starts.
export default function GalleryHeroSection({ images }: { images: GalleryHeroImageData[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMultiple = images.length > 1

  useEffect(() => {
    if (!hasMultiple) return
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length)
    }, 5000)
    return () => clearInterval(id)
  }, [hasMultiple, images.length])

  if (images.length === 0) {
    return (
      <section className="relative w-full aspect-[16/7] sm:aspect-[21/6] bg-jays-navy overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-white/60">
          <Images size={36} />
          <p className="text-sm font-medium">Gallery hero coming soon</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative w-full aspect-[16/7] sm:aspect-[21/6] bg-jays-navy overflow-hidden">
      {images.map((img, idx) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={idx !== activeIndex}
        >
          <Image
            src={img.imageUrl}
            alt={img.altText || 'Jays Shop gallery'}
            fill
            priority={idx === 0}
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {hasMultiple && (
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              aria-label={`Show hero image ${idx + 1}`}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
