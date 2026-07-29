'use client'

import HeroSlideshow, { type Slide as HeroSlide } from '@/components/shop/HeroSlideshow'
import { heroFallbackStyle } from '@/lib/hero/heroFallbackStyle'

export default function ShopHero({
  liveLabel,
  livePulse,
  initialSlides,
}: {
  liveLabel: string
  livePulse: boolean
  initialSlides?: HeroSlide[]
}) {
  return (
    <section
      className="relative h-[calc(100svh-var(--header-height,5.75rem)-2.75rem-56px-env(safe-area-inset-bottom,0px))] min-h-[320px] sm:min-h-0 w-full overflow-hidden bg-jays-navy sm:h-[60vh] sm:max-h-[560px] lg:h-[calc(64vh+151px)] lg:max-h-[771px]"
      style={heroFallbackStyle(initialSlides)}
    >
      {/* Full-bleed hero image/slideshow. object-cover + object-top keeps the
          player's face/torso in frame across every breakpoint; the gradient
          overlay (applied inside HeroSlideshow) keeps overlaid text readable
          without hiding the artwork. Fade transitions between slides. */}
      <HeroSlideshow scope="SHOP" imagePosition="top" initialSlides={initialSlides} />

      {/* Live badge — centered at the bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        {/* pb reserves the slideshow-control band below the badge: controls
            occupy 56px under sm (bottom-3 12px + 44px buttons) and 60px from
            sm up (bottom-4 16px + 44px). pb-[4.5rem] (72px) = 56px + 16px
            clearance on phones; sm:pb-20 (80px) = 60px + 20px. */}
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-[4.5rem] sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.15em] text-emerald-300 backdrop-blur-sm transition-opacity duration-500 ${
              livePulse ? 'opacity-100' : 'opacity-90'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {liveLabel}
          </span>
        </div>
      </div>
    </section>
  )
}
