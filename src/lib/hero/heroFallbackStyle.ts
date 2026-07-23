import type { CSSProperties } from 'react'
import type { Slide } from '@/types/hero'

/**
 * Inline style for a hero section's outer `<section>` container that paints
 * the first active slide's server-generated blurred placeholder as a CSS
 * `background-image`.
 *
 * Why this exists: `HeroSlideshow` renders the real `<Image>`/`<video>` as a
 * *child* of this section, but there is always an unavoidable gap — the
 * time between the browser compositing the section's own background and the
 * child media actually painting (network/decode latency, hydration, or even
 * just the first paint of a hard reload before any JS runs). Previously
 * that gap exposed the section's flat `bg-jays-navy` Tailwind class, which
 * reads as a jarring "blue flash" because it doesn't resemble the real
 * photo at all.
 *
 * By applying the *same* `blurDataURL` we already generate server-side
 * (see `getBlurDataURL`) directly on the section via inline `style`, the
 * blurred preview is present in the server-rendered HTML itself — it shows
 * up on the very first composited frame, with zero JS and zero network
 * round-trip, and is color-accurate to the real image. `HeroSlideshow`'s own
 * `<Image placeholder="blur">` then cross-fades the full-res photo on top of
 * it, so the transition is blur-to-sharp on the *same* image rather than
 * navy-to-image.
 *
 * Returns `undefined` when no active slide has a blur placeholder (e.g. all
 * slides are videos, or generation failed), letting the section's
 * `bg-jays-navy` class remain as an inert last-resort fallback.
 */
export function heroFallbackStyle(slides: Slide[] | undefined): CSSProperties | undefined {
  const withBlur = slides?.find((s) => s.active && !!s.blurDataURL)
  if (!withBlur?.blurDataURL) return undefined
  return {
    backgroundImage: `url(${withBlur.blurDataURL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}
