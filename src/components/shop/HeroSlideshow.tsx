'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import type { HeroScope, Slide } from '@/types/hero'
import { useHeroMedia } from '@/hooks/useHeroMedia'
import { isBlobUpload } from '@/lib/media/upload'

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
  /**
   * Colour theme for the prev/pause/next control icons. 'light' (default)
   * is the original ghosted-white styling, calibrated for hero sections
   * that keep their bg-jays-navy fallback — white reads fine there whether
   * the icon sits over photo content or the navy gutter. 'dark' renders the
   * same original size/position/no-plate geometry but in jays-navy instead,
   * for the one hero (Popular Players) whose section background is white,
   * where white-on-white controls would be invisible.
   */
  controlsTheme?: 'light' | 'dark'
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
  controlsTheme = 'light',
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

  // Fallback media when a remote blob (or any URL) fails to load. We keep the
  // original slide data but swap the rendered src so the hero never collapses
  // to a blank navy block during a blob outage.
  const FALLBACK_IMAGE = '/uploads/hero-slides/shop-by-style/shop-by-style-hero.jpg'
  const [fallbackSrcById, setFallbackSrcById] = useState<Record<string, string>>({})
  const setFallback = useCallback((id: string) => {
    setFallbackSrcById((prev) => (prev[id] ? prev : { ...prev, [id]: FALLBACK_IMAGE }))
  }, [])

  // When a video plays to its natural end, automatically advance to the next
  // slide. isPlaying stays true so the slideshow keeps rotating.
  const handleVideoEnded = useCallback(() => {
    setIndex((i) => (i + 1) % slideCount)
  }, [slideCount])

  if (!loaded || slides.length === 0) return null

  const hasControls = showControls && slideCount > 1

  // Derive a lightweight poster for video slides from the nearest image slide's
  // server-generated blurDataURL. data: URIs are valid <video poster> values in
  // all modern browsers. This prevents a black video frame while autoPlay buffers
  // the first frames — especially important for video-first hero configurations
  // where no image slide exists to provide a heroFallbackStyle section background.
  const nearestBlurDataURL =
    slides.find((s) => s.mediaType === 'IMAGE' && !!s.blurDataURL)?.blurDataURL ?? undefined

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
        const isReady = readyIds.has(slide.id)
        const hasBlur = slide.mediaType === 'IMAGE' && !!slide.blurDataURL
        // The first slide (i === 0) is exempt from the readyIds opacity gate.
        // readyIds exists to prevent partially-decoded images from flashing in
        // during cross-fade transitions between slides — a valid concern for
        // slides 1, 2, … that the user hasn't requested yet. For the FIRST slide
        // it is counter-productive: because readyIds starts as an empty Set on
        // every render (SSR and client-hydration alike), gating i === 0 on it
        // means the first slide's media is opacity-0 in the initial SSR HTML and
        // stays opacity-0 until onLoad/onLoadedData fires — which can be 1–5 s
        // on a slow connection. The user sees nothing but the solid bg-jays-navy
        // fallback for that entire window, which is the "blank hero" flash.
        //
        // With the gate removed for i === 0:
        //  • IMAGE slides with blurDataURL: placeholder="blur" shows the inline
        //    blurred preview from the first composited frame; heroFallbackStyle on
        //    the parent <section> shows the same blur via CSS background — both
        //    are visible before any JS runs, and the full-res image cross-fades in
        //    on its own onLoad without any additional state change needed.
        //  • IMAGE slides without blurDataURL: the <img> is transparent until
        //    decoded (AVIF/WebP are non-progressive), but the section's bg-jays-navy
        //    shows through — same as before, but now the final decode appears
        //    directly (no 500 ms fade-in delay added by a state→opacity transition).
        //  • VIDEO slides: with opacity-100 from first render plus poster= set to
        //    the nearest image slide's blurDataURL, the browser immediately paints
        //    the poster frame while autoPlay buffers — no black frame, no navy flash.
        const isFirstSlide = i === 0
        const isRemoteBlob = isBlobUpload(slide.url)
        const mediaSrc = fallbackSrcById[slide.id] ?? slide.url
        // Video slides: absolutely positioned to fill the slide container
        // (matching the Next/Image `fill` layout) so the video element
        // never causes a reflow or CLS on load. will-change-transform
        // promotes it to its own GPU compositing layer for jitter-free
        // opacity cross-fades.
        const videoCls = `absolute inset-0 h-full w-full object-cover object-${imagePosition} will-change-transform backface-hidden transition-opacity duration-500 ease-out ${
          isFirstSlide || isReady ? 'opacity-100' : 'opacity-0'
        }`
        const mediaCls = `h-full w-full object-cover object-${imagePosition} transition-opacity duration-500 ease-out ${
          isFirstSlide || hasBlur || isReady ? 'opacity-100' : 'opacity-0'
        }`
        return (
          <div key={slide.id} className={cls} style={style}>
            {slide.mediaType === 'VIDEO' ? (
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(slide.id, el)
                  else videoRefs.current.delete(slide.id)
                }}
                src={mediaSrc}
                autoPlay={!fallbackSrcById[slide.id]}
                muted
                playsInline
                preload={isRemoteBlob ? 'metadata' : 'auto'}
                poster={nearestBlurDataURL}
                disablePictureInPicture
                loop={!!fallbackSrcById[slide.id]}
                className={videoCls}
                style={{ WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
                aria-label={slide.altText || `${scope} hero video`}
                onLoadedData={() => markReady(slide.id)}
                onError={() => setFallback(slide.id)}
                onEnded={handleVideoEnded}
              />
            ) : (
              <Image
                src={mediaSrc}
                alt={slide.altText || `${scope} hero image`}
                fill
                sizes="100vw"
                quality={85}
                priority={i === 0}
                className={mediaCls}
                onLoad={() => markReady(slide.id)}
                onError={() => setFallback(slide.id)}
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
           Original geometry/spacing/no-plate design preserved exactly.
           Icon colour is theme-driven: 'light' (default) keeps the
           original ghosted-white styling used by every hero that still
           has a navy fallback background; 'dark' (Popular Players only,
           whose section is now white) swaps to jays-navy so the controls
           stay legible, with no other layout change. */
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 sm:bottom-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className={
              controlsTheme === 'dark'
                ? 'flex h-8 w-8 items-center justify-center rounded-full text-jays-navy/50 transition-all duration-200 hover:bg-jays-navy/10 hover:text-jays-navy focus-visible:text-jays-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jays-navy active:scale-95 sm:h-9 sm:w-9'
                : 'flex h-8 w-8 items-center justify-center rounded-full text-white/40 drop-shadow-sm transition-all duration-200 hover:bg-white/10 hover:text-white/80 focus-visible:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-9 sm:w-9'
            }
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={togglePlaying}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            aria-pressed={isPlaying}
            className={
              controlsTheme === 'dark'
                ? 'flex h-8 w-8 items-center justify-center rounded-full text-jays-navy/80 transition-all duration-200 hover:bg-jays-navy/10 hover:text-jays-navy focus-visible:text-jays-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jays-navy active:scale-95 sm:h-9 sm:w-9'
                : 'flex h-8 w-8 items-center justify-center rounded-full text-white/70 drop-shadow-lg transition-all duration-200 hover:bg-white/10 hover:text-white focus-visible:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-9 sm:w-9'
            }
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
            className={
              controlsTheme === 'dark'
                ? 'flex h-8 w-8 items-center justify-center rounded-full text-jays-navy/50 transition-all duration-200 hover:bg-jays-navy/10 hover:text-jays-navy focus-visible:text-jays-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jays-navy active:scale-95 sm:h-9 sm:w-9'
                : 'flex h-8 w-8 items-center justify-center rounded-full text-white/40 drop-shadow-sm transition-all duration-200 hover:bg-white/10 hover:text-white/80 focus-visible:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 sm:h-9 sm:w-9'
            }
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
