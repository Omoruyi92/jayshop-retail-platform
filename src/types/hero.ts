// Shared hero-slide types used by both the server-side fetch util
// (`@/lib/hero/getHeroSlides`) and the client-side hook
// (`@/hooks/useHeroMedia`), so the Home/Shop/Style/Players hero components
// all speak the same shape without duplicating type definitions.

export type HeroScope = 'HOME' | 'SHOP' | 'STYLE_LANDING' | 'PLAYERS'

export interface Slide {
  id: string
  scope: string
  mediaType: 'IMAGE' | 'VIDEO'
  url: string
  mobileUrl: string | null
  altText: string | null
  sortOrder: number
  active: boolean
  /**
   * Tiny base64-encoded low-quality preview of `url`, generated server-side
   * (see `@/lib/hero/getBlurDataURL`). Used as the `next/image` `blurDataURL`
   * so the very first paint shows a soft, color-accurate preview of the
   * actual photo instead of the section's solid `bg-jays-navy` fallback.
   * `null`/`undefined` for videos (no still to derive a placeholder from),
   * slides fetched via the `/api/hero-slides` client-side fallback route
   * (which doesn't compute it), or if generation failed for any reason —
   * `HeroSlideshow` degrades gracefully to rendering without a blur preview
   * in that case.
   */
  blurDataURL?: string | null
}
