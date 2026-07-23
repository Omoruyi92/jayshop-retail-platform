'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import type { HeroScope, Slide } from '@/types/hero'
import { useHeroMedia } from '@/hooks/useHeroMedia'

// Re-exported for backward compatibility — existing call sites import
// `Slide` from this module; the canonical definition now lives in
// `@/types/hero` so both this client component and the server-side
// `getHeroSlides` util share the same shape.
export type { Slide } from '@/types/hero'

interface HeroSlideshowProps {
  scope: HeroScope
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
  const { slides, loaded } = useHeroMedia(scope, initialSlides)
  const [index, setIndex] = useState(0)
  // Tracks which slides have finished decoding/loading their media. Until a
  // given slide's own image/video signals ready, it stays invisible (opacity
  // 0) rather than painting the browser's partial/progressive decode — this
  // is what previously caused a glitchy top-down "reveal" of the raw image
  // over the solid hero background instead of a single clean appearance.
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set())
  const markReady = (id: string) =>
    setReadyIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))

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
        // Videos have no still-frame placeholder, so they keep the previous
        // behavior: stay fully transparent (revealing the blurred image
        // underneath, or the solid background as a last resort) until their
        // own load event fires, avoiding a partially-decoded/streaming
        // frame. Images that have a server-generated `blurDataURL` skip
        // this gate entirely — Next's native `placeholder="blur"` already
        // shows that soft preview immediately and cross-fades to the
        // full-res decode on its own `onLoad`, so our own opacity gate
        // would otherwise hide that blur too and bring back the solid
        // navy flash this was meant to eliminate.
        const isReady = readyIds.has(slide.id)
        const hasBlur = slide.mediaType === 'IMAGE' && !!slide.blurDataURL
        const mediaCls = `h-full w-full object-cover object-${imagePosition} transition-opacity duration-500 ease-out ${
          hasBlur || isReady ? 'opacity-100' : 'opacity-0'
        }`
        return (
          <div key={slide.id} className={cls} style={style}>
            {slide.mediaType === 'VIDEO' ? (
              <video
                src={slide.url}
                autoPlay
                muted
                loop
                playsInline
                className={mediaCls}
                aria-label={slide.altText || `${scope} hero video`}
                onLoadedData={() => markReady(slide.id)}
              />
            ) : (
              <Image
                src={slide.url}
                alt={slide.altText || `${scope} hero image`}
                fill
                sizes="100vw"
                quality={95}
                priority={i === 0}
                className={mediaCls}
                unoptimized
                onLoad={() => markReady(slide.id)}
                {...(slide.blurDataURL
                  ? { placeholder: 'blur' as const, blurDataURL: slide.blurDataURL }
                  : {})}
              />
            )}
            {overlay && <div className="absolute inset-0 bg-gradient-to-t from-jays-navy/80 via-jays-navy/25 to-jays-navy/10" />}
          </div>
        )
      })}
    </div>
  )
}
