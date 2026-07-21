'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import HeroSlideshow, { type Slide as HeroSlide } from '@/components/shop/HeroSlideshow'

interface HomeHeroProps {
  isGameDayToday?: boolean
  initialSlides?: HeroSlide[]
}

/**
 * Edge-to-edge homepage hero. The uploaded HOME hero image/video is the
 * primary visual — only a minimal, unboxed live-inventory tag + headline sit
 * directly over the media in the bottom-left corner (no card/panel
 * background), so the artwork itself stays the focus. The Game Day notice
 * lives in its own distinct spot (top-right) so it never competes with the
 * corner headline. CTAs and the trust stats row live in a separate section
 * just below the hero (see HomePageClient) rather than overlaying the media.
 */
export default function HomeHero({ isGameDayToday = false, initialSlides }: HomeHeroProps) {
  const { t } = useLanguage()
  const h = t.home

  return (
    <section className="relative isolate h-[50vh] max-h-[500px] min-h-[360px] w-full overflow-hidden bg-jays-navy sm:h-[56vh] sm:max-h-[560px] lg:h-[62vh] lg:max-h-[620px]">
      {/* Full-bleed hero media, primary visual focus */}
      <HeroSlideshow scope="HOME" imagePosition="top" initialSlides={initialSlides} />

      {/* Game Day notice — top-right corner, its own distinct spot so it
          never collides with the bottom-left headline. Only rendered on
          confirmed game days. */}
      {isGameDayToday && (
        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-jays-navy/60 px-3 py-1.5 text-[10px] font-display font-semibold uppercase tracking-[0.12em] text-amber-200 shadow-lg backdrop-blur-md sm:px-3.5 sm:text-[11px]">
            <span className="text-sm leading-none">⚾</span>
            <span>{h.gameDayBanner}</span>
          </div>
        </div>
      )}

      {/* Corner headline — unboxed, sits directly on the media (gradient
          overlay from HeroSlideshow keeps it legible) rather than in a
          card/panel. */}
      <div className="absolute bottom-0 left-0 z-10 max-w-[85%] px-4 pb-4 sm:max-w-md sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
        <div className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-display font-semibold uppercase tracking-[0.2em] text-blue-200/90 drop-shadow sm:text-[11px]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red animate-pulse" />
          Live Inventory · Rogers Centre
        </div>
        <h1 className="font-display text-xl font-bold uppercase leading-tight tracking-wide text-white drop-shadow-md sm:text-2xl lg:text-3xl">
          {h.heroTitle1} <span className="text-amber-300">{h.heroTitle2}</span>
        </h1>
      </div>
    </section>
  )
}
