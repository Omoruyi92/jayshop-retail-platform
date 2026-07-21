'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Image from 'next/image'

export interface Slide {
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
  scope: 'HOME' | 'SHOP' | 'STYLE_LANDING' | 'PLAYERS'
  interval?: number
  className?: string
  imagePosition?: 'center' | 'top' | 'bottom'
  /**
   * Slides already resolved on the server (or by a parent that fetched them
   * ahead of time). When provided, the slideshow renders with this data
   * immediately on first paint instead of waiting on a client-side fetch,
   * which eliminates the brief flash of the default hero background before
   * admin-configured media appears.
   */
  initialSlides?: Slide[]
  /**
   * Whether to apply the darkening gradient overlay that keeps overlaid
   * text/badges readable. Set false for hero sections that show only the
   * uploaded media with no text on top, for a clean edge-to-edge look.
   */
  overlay?: boolean
  /**
   * Transition style between slides. 'fade' (default) is used for most hero
   * sections for a smooth, understated crossfade. 'slide' produces a
   * dynamic horizontal carousel motion — reserved for sections like Popular
   * Players where a more energetic browsing feel is desired.
   */
  transition?: 'fade' | 'slide'
}

export default function HeroSlideshow({
  scope,
  interval = 6000,
  className = '',
  imagePosition = 'center',
  initialSlides,
  overlay = true,
  transition = 'fade',
}: HeroSlideshowProps) {
  const hasInitialSlides = Array.isArray(initialSlides)
  const [slides, setSlides] = useState<Slide[]>(
    hasInitialSlides ? [...initialSlides!].filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder) : []
  )
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(hasInitialSlides)

  useEffect(() => {
    // Slides were already provided synchronously (server-fetched) — skip the
    // client-side fetch entirely so there is no loading gap/flash.
    if (hasInitialSlides) return

    fetch(`/api/hero-slides?scope=${scope}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Slide[]) => {
        const active = Array.isArray(data) ? data.filter((s) => s.active) : []
        setSlides(active.sort((a, b) => a.sortOrder - b.sortOrder))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, hasInitialSlides])

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
      {slides.map((slide, i) => {
        let style: CSSProperties
        let cls: string
        if (transition === 'slide') {
          const total = slides.length
          let rel = i - index
          if (rel > total / 2) rel -= total
          if (rel < -total / 2) rel += total
          cls = 'absolute inset-0 transition-transform duration-700 ease-in-out will-change-transform'
          style = { transform: `translateX(${rel * 100}%)`, zIndex: i === index ? 1 : 0 }
        } else {
          cls = `absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-[opacity] ${i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`
          style = {}
        }
        return (
          <div key={slide.id} className={cls} style={style}>
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
            {overlay && <div className="absolute inset-0 bg-gradient-to-t from-jays-navy/80 via-jays-navy/25 to-jays-navy/10" />}
          </div>
        )
      })}
    </div>
  )
}
