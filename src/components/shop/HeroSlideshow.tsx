'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
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
  /**
   * Whether to render the play/pause + prev/next control bar. Defaults to
   * true; controls only actually render once there are 2+ slides (a single
   * slide has nothing to navigate to/from). Controls are absolutely
   * positioned overlays anchored to this component's own `inset-0`
   * container, so they never affect the outer hero section's reserved
   * dimensions — no CLS impact.
   */
  showControls?: boolean
}

export default function HeroSlideshow({
  scope,
  interval = 6000,
  className = '',
  imagePosition = 'center',
  initialSlides,
  overlay = true,
  transition = 'fade',
  showControls = true,
}: HeroSlideshowProps) {
  const { slides, loaded } = useHeroMedia(scope, initialSlides)
  const [index, setIndex] = useState(0)
  // Whether automatic rotation is currently running. Manual prev/next always
  // pauses it (a common, predictable carousel UX pattern — the user just
  // told the slideshow what they want to look at, so it shouldn't immediately
  // sweep past it), and the play/pause button toggles it directly.
  const [isPlaying, setIsPlaying] = useState(true)
  // Tracks which slides have finished decoding/loading their media. Until a
  // given slide's own image/video signals ready, it stays invisible (opacity
  // 0) rather than painting the browser's partial/progressive decode — this
  // is what previously caused a glitchy top-down "reveal" of the raw image
  // over the solid hero background instead of a single clean appearance.
  const [readyIds, setReadyIds] = useState<Set<string>>(new Set())
  const markReady = (id: string) =>
    setReadyIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))

  // Map of slide id → <video> element for programmatic play/pause/reset control.
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  // Tracks the last slide index we "arrived at" as a VIDEO slide so we can
  // reset currentTime to 0 on slide entry without also resetting on a simple
  // isPlaying toggle while staying on the same video slide.
  const lastVideoIndexRef = useRef<number>(-1)

  const slideCount = slides.length
  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slideCount) + slideCount) % slideCount)
    },
    [slideCount]
  )
  const goPrev = useCallback(() => {
    setIsPlaying(false)
    goTo(index - 1)
  }, [goTo, index])
  const goNext = useCallback(() => {
    setIsPlaying(false)
    goTo(index + 1)
  }, [goTo, index])
  const togglePlaying = useCallback(() => setIsPlaying((p) => !p), [])

  // IMAGE slides: use the normal fixed-interval auto-advance.
  // VIDEO slides skip this entirely — they advance via the onEnded handler
  // once the video plays to its natural end.
  useEffect(() => {
    if (slideCount <= 1 || !isPlaying) return
    const currentSlide = slides[index]
    if (currentSlide?.mediaType === 'VIDEO') return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slideCount)
    }, interval)
    return () => clearInterval(id)
  }, [slideCount, interval, isPlaying, index, slides])

  // VIDEO slides: reset playback to the start whenever we arrive at a new
  // video slide, and keep the video element in sync with the isPlaying flag.
  useEffect(() => {
    const currentSlide = slides[index]
    if (!currentSlide || currentSlide.mediaType !== 'VIDEO') {
      // Leaving a video slide — clear the tracking ref so the next video
      // slide is guaranteed to get a fresh reset.
      lastVideoIndexRef.current = -1
      return
    }

    const videoEl = videoRefs.current.get(currentSlide.id)
    if (!videoEl) return

    // Only reset to the start when we genuinely navigate to a new video slide,
    // not when isPlaying flips while we're already watching this slide.
    if (lastVideoIndexRef.current !== index) {
      lastVideoIndexRef.current = index
      videoEl.currentTime = 0
    }

    if (isPlaying) {
      videoEl.play().catch(() => {
        // play() can be rejected if the browser interrupts (e.g. a rapid
        // slide switch before the previous promise settled). Safe to ignore.
      })
    } else {
      videoEl.pause()
    }
  }, [index, isPlaying, slides])

  // When a video plays to its natural end, automatically advance to the next
  // slide. isPlaying stays true so the slideshow keeps rotating.
  const handleVideoEnded = useCallback(() => {
    setIndex((i) => (i + 1) % slideCount)
  }, [slideCount])

  if (!loaded || slides.length === 0) return null

  const hasControls = showControls && slideCount > 1

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
          cls = 'absolute inset-0 transition-transform duration-700 ease-in-out will-change-transform backface-hidden'
          style = { transform: `translateX(${rel * 100}%)`, zIndex: i === index ? 1 : 0 }
        } else {
          cls = `absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-[opacity] backface-hidden ${i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'}`
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
        // Video slides: absolutely positioned to fill the slide container
        // (matching the Next/Image `fill` layout) so the video element
        // never causes a reflow or CLS on load. will-change-transform
        // promotes it to its own GPU compositing layer for jitter-free
        // opacity cross-fades.
        const videoCls = `absolute inset-0 h-full w-full object-cover object-${imagePosition} will-change-transform backface-hidden transition-opacity duration-500 ease-out ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`
        const mediaCls = `h-full w-full object-cover object-${imagePosition} transition-opacity duration-500 ease-out ${
          hasBlur || isReady ? 'opacity-100' : 'opacity-0'
        }`
        return (
          <div key={slide.id} className={cls} style={style}>
            {slide.mediaType === 'VIDEO' ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(slide.id, el)
                  else videoRefs.current.delete(slide.id)
                }}
                src={slide.url}
                autoPlay
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                className={videoCls}
                style={{ WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
                aria-label={slide.altText || `${scope} hero video`}
                onLoadedData={() => markReady(slide.id)}
                onEnded={handleVideoEnded}
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

      {hasControls && (
        /* [Prev] [Play/Pause] [Next] — bottom-center, no container bg.
           Ghosted white icons + drop-shadow: readable on any hero image,
           invisible until needed (Netflix/Apple TV+ style). */
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 sm:bottom-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 drop-shadow-lg transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={togglePlaying}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            aria-pressed={isPlaying}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 drop-shadow-lg transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-9 sm:w-9"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 translate-x-[1px]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 drop-shadow-lg transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
