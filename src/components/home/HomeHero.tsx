'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import HeroSlideshow, { type Slide as HeroSlide } from '@/components/shop/HeroSlideshow'
import { heroFallbackStyle } from '@/lib/hero/heroFallbackStyle'

interface HomeHeroProps {
  isGameDayToday?: boolean
  initialSlides?: HeroSlide[]
}

/**
 * Edge-to-edge homepage hero. The uploaded HOME hero image/video is the
 * primary visual. The two hero source assets (desktop + mobile) are composed
 * with a dedicated clean/negative-space region for this overlay text — the
 * LEFT HALF on desktop (wide, landscape framing) and the UPPER portion on
 * mobile (portrait framing, merchandise sits in the lower third) — so the
 * text block below is positioned to match rather than competing with the
 * merchandise in frame. The Game Day notice lives in its own distinct spot
 * (top-right) so it never collides with the headline. CTAs and the trust
 * stats row live in a separate section just below the hero (see
 * HomePageClient) rather than overlaying the media.
 *
 * Below `lg:` (mobile portrait, mobile landscape, and tablet portrait —
 * exactly the widths where the headline block itself switches from the
 * left-half/vertically-centered desktop layout to the top-anchored mobile
 * stack, see the headline block's own comment below) the full top-right
 * Game Day pill has no safe spot: the headline is full-width and top-
 * anchored down here, so there's no open column beside it the way there is
 * on desktop. The mobile variant is instead a small condensed pill parked
 * low in the hero (`bottom-28 right-4`, see its own comment for the exact
 * clearance math against the slideshow controls, the fixed chat launcher,
 * and the mobile bottom nav). The `lg:` desktop pill is left completely
 * untouched (only gated behind `hidden lg:block` so it simply doesn't
 * render below `lg:`) so the existing desktop screenshot stays pixel-
 * identical.
 */
export default function HomeHero({ isGameDayToday = false, initialSlides }: HomeHeroProps) {
  const { t } = useLanguage()
  const h = t.home

  return (
    <section
      // sm:min-h-[260px]: at sm+ the mobile 320px floor is dropped so short
      // landscape viewports (e.g. 844x390) are not forced taller than the
      // fold, but the hero still cannot shrink below its own overlay stack:
      // top-anchored text (~176px to the paragraph's bottom edge at sm
      // landscape widths) + >=24px clearance + the slideshow control band
      // (bottom-4 16px + 44px buttons = 60px) = 260px.
      className="relative isolate h-[calc(100svh-var(--header-height,5.75rem)-2.75rem-56px-env(safe-area-inset-bottom,0px))] min-h-[320px] sm:min-h-[260px] w-full overflow-hidden bg-jays-navy sm:h-[56vh] sm:max-h-[560px] lg:h-[calc(62vh+151px)] lg:max-h-[771px]"
      style={heroFallbackStyle(initialSlides)}
    >
      {/* Full-bleed hero media, primary visual focus */}
      <HeroSlideshow scope="HOME" imagePosition="top" initialSlides={initialSlides} />

      {/* Game Day notice — top-right corner, its own distinct spot so it
          never collides with the headline. Only rendered on confirmed game
          days. Desktop-only (`lg:` and up): below that breakpoint this is
          replaced by the condensed pill near the bottom of the hero (see
          the other Game Day notice block further down). `hidden lg:block`
          is the ONLY change here versus the original desktop markup — at
          `lg:` and up it resolves to the exact same `block` display the
          div always had, so the desktop rendering is pixel-identical. */}
      {isGameDayToday && (
        <div className="hidden lg:block absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-jays-navy/60 px-3 py-1.5 text-[10px] font-display font-semibold uppercase tracking-[0.12em] text-amber-200 shadow-lg backdrop-blur-md sm:px-3.5 sm:text-[11px]">
            <span className="text-sm leading-none">⚾</span>
            <span>{h.gameDayBanner}</span>
          </div>
        </div>
      )}

      {/* Extra scrim behind the text block only, layered on top of
          HeroSlideshow's own full-bleed gradient. On mobile it fades
          top-to-bottom (text sits in the upper portion, above the jersey
          rack); on desktop (lg:) it switches to a left-to-right fade (text
          sits in the left half, over the clean wall in the video) so the
          merchandise on the right stays untouched. Purely decorative —
          pointer-events-none so it never blocks the slideshow controls. */}
      <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-b from-jays-navy/70 via-jays-navy/15 to-transparent lg:bg-gradient-to-r lg:from-jays-navy/70 lg:via-jays-navy/20 lg:to-transparent" />

      {/* Headline block.
          Mobile/tablet (<1024px): pinned to the upper portion of the hero
          (matching the mobile video's clean upper-half composition), with
          side padding clear of the sticky header above and the bottom nav
          below (both already excluded from this section's own height calc).
          Desktop (>=1024px): left-aligned, vertically centered, constrained
          to ~48% width so it never overlaps the merchandise on the right
          (matching the desktop video's clean left-half composition). */}
      <div className="absolute inset-x-0 top-0 z-10 px-5 pt-6 xs:px-6 sm:px-8 sm:pt-8 lg:inset-y-0 lg:flex lg:w-[48%] lg:max-w-[48%] lg:flex-col lg:justify-center lg:px-10 lg:pt-0 xl:px-14">
        <div className="mb-2.5 inline-flex items-center gap-1.5 text-[10px] font-display font-semibold uppercase tracking-[0.2em] text-blue-200/90 drop-shadow sm:text-[11px]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red animate-pulse" />
          Live Inventory · Rogers Centre
        </div>
        <h1
          className="max-w-[22ch] text-balance font-display font-bold uppercase leading-[1.05] tracking-wide text-white drop-shadow-md"
          style={{ fontSize: 'clamp(1.5rem, 1.05rem + 3.2vw, 3.5rem)' }}
        >
          {h.heroTitle1} <span className="text-amber-300">{h.heroTitle2}</span>
        </h1>
        <p
          className="mt-3 max-w-[38ch] text-balance font-sans text-white/85 drop-shadow-sm sm:mt-4"
          style={{ fontSize: 'clamp(0.8125rem, 0.72rem + 0.55vw, 1.0625rem)' }}
        >
          {h.heroSubtitle}
        </p>
        <div className="mt-4 sm:mt-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-wider text-jays-navy shadow-lg shadow-black/10 backdrop-blur-sm transition-all hover:bg-jays-ice hover:shadow-xl active:scale-[0.97] sm:px-5 sm:py-3 sm:text-sm"
          >
            {h.browseShop}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Game Day notice — mobile/tablet condensed variant (below `lg:`).
          The headline block above is top-anchored and full-width down here
          (no left/right half split until `lg:`), so there is no safe spot
          near the top; instead this sits low in the hero, well above the
          slideshow's bottom-center prev/pause/next band, using a bottom
          offset (7rem/112px) chosen so it clears every other floating
          piece at every tested mobile/tablet size:
            - controls: bottom-3/4 (12-16px) + 44px tall buttons = a 56-60px
              band from the section's bottom edge — 112px clears that with
              room to spare even at the shortest (844x390 landscape, 260px
              tall) section.
            - the fixed page-level chat launcher (ChatFAB, `sm:` and up,
              bottom-6/right-4, 56px): at short landscape heights the hero
              nearly fills the viewport, so ChatFAB's top edge can sit close
              to the hero's own bottom edge. 112px keeps this badge's row
              above ChatFAB's row too, so the two never share the same
              horizontal band regardless of width.
            - the mobile-only fixed bottom nav bar (`sm:hidden`, its own
              ~65px band pinned to the true viewport bottom): only relevant
              below `sm:`, where 112px of clearance from the *hero's* own
              bottom edge keeps this well above it as well.
          `lg:hidden` hands off to the full pill above once the headline
          block itself switches to the desktop left-half layout. */}
      {isGameDayToday && (
        <div className="lg:hidden absolute bottom-28 right-4 z-10">
          <div className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-jays-navy/70 px-2.5 py-1 text-[9px] font-display font-semibold uppercase tracking-[0.1em] text-amber-200 shadow-lg backdrop-blur-md sm:px-3 sm:text-[10px]">
            <span className="text-xs leading-none">⚾</span>
            <span>{h.gameDayBannerShort}</span>
          </div>
        </div>
      )}
    </section>
  )
}
