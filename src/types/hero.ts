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
}
