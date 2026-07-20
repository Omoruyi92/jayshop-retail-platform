'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Slide {
  id: string
  scope: string
  mediaType: 'IMAGE' | 'VIDEO'
  url: string
  mobileUrl: string | null
  altText: string | null
  sortOrder: number
  active: boolean
}

interface HeroSlideshowProps {
  scope: 'HOME' | 'SHOP'
  interval?: number
  className?: string
  imagePosition?: 'center' | 'top' | 'bottom'
}

export default function HeroSlideshow({ scope, interval = 6000, className = '', imagePosition = 'center' }: HeroSlideshowProps) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/hero-slides?scope=${scope}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Slide[]) => {
        const active = Array.isArray(data) ? data.filter((s) => s.active) : []
        setSlides(active.sort((a, b) => a.sortOrder - b.sortOrder))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [scope])

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, interval)
    return () => clearInterval(id)
  }, [slides.length, interval])

  if (!loaded || slides.length === 0) return null

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-[opacity] ${i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`}
        >
          {slide.mediaType === 'VIDEO' ? (
            <video
              src={slide.url}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              aria-label={slide.altText || `${scope} hero video`}
            />
          ) : (
            <Image
              src={slide.url}
              alt={slide.altText || `${scope} hero image`}
              fill
              sizes="100vw"
              quality={95}
              priority={i === 0}
              className={`h-full w-full object-cover object-${imagePosition}`}
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-jays-navy/40" />
        </div>
      ))}
    </div>
  )
}
