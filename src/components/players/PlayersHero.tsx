import HeroSlideshow, { type Slide as HeroSlide } from '@/components/shop/HeroSlideshow'
import { heroFallbackStyle } from '@/lib/hero/heroFallbackStyle'

/**
 * Premium, full-bleed hero for the "Popular Players" landing page.
 *
 * Admin-managed via the Hero Media admin page's "Players Hero" tab
 * (scope=PLAYERS), reusing the same HeroSlideshow component and
 * upload/order/delete infrastructure already powering the Home, Shop,
 * and Shop by Style heroes. Renders nothing when no admin media has
 * been configured yet, so the page falls back cleanly to the existing
 * text header below without showing an empty banner block.
 *
 * Uses the same "fade" crossfade transition as the Home/Shop/Shop-by-Style
 * heroes for a consistent, understated browsing feel across the site.
 *
 * `initialSlides` is fetched server-side (see `players/page.tsx`) and
 * passed straight through — matching Home/Shop/Shop-by-Style — so the
 * hero is present on the very first paint with no client fetch delay,
 * flash, or reveal animation. The hero intentionally never participates
 * in the page's content-card reveal animation (see `Reveal`).
 */
export default function PlayersHero({ initialSlides }: { initialSlides: HeroSlide[] }) {
  const hasSlides = initialSlides.some((s) => s.active)

  if (!hasSlides) return null

  return (
    <section
      className="relative h-[calc(100svh-var(--header-height,5.75rem)-2.75rem-56px-env(safe-area-inset-bottom,0px))] min-h-[320px] w-full overflow-hidden bg-jays-navy sm:h-[60vh] sm:max-h-[560px] lg:h-[calc(64vh+151px)] lg:max-h-[771px]"
      style={heroFallbackStyle(initialSlides)}
    >
      <HeroSlideshow scope="PLAYERS" imagePosition="top" overlay={false} initialSlides={initialSlides} transition="fade" />
    </section>
  )
}
