'use client'

import SearchBar from '@/components/shop/SearchBar'
import HeroSlideshow, { type Slide as HeroSlide } from '@/components/shop/HeroSlideshow'

export default function ShopHero({
  searchValue,
  onSearchChange,
  liveLabel,
  livePulse,
  initialSlides,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
  liveLabel: string
  livePulse: boolean
  initialSlides?: HeroSlide[]
}) {
  return (
    <section className="relative h-[56vh] max-h-[520px] min-h-[380px] w-full overflow-hidden bg-jays-navy sm:h-[60vh] sm:max-h-[560px] lg:h-[64vh] lg:max-h-[620px]">
      {/* Full-bleed hero image/slideshow. object-cover + object-top keeps the
          player's face/torso in frame across every breakpoint; the gradient
          overlay (applied inside HeroSlideshow) keeps overlaid text readable
          without hiding the artwork. Fade transitions between slides. */}
      <HeroSlideshow scope="SHOP" imagePosition="top" initialSlides={initialSlides} />

      {/* Content anchored bottom-left, consistent across breakpoints */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
          <div className="max-w-xl">
            <span
              className={`mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.15em] text-emerald-300 backdrop-blur-sm transition-opacity duration-500 ${
                livePulse ? 'opacity-100' : 'opacity-90'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {liveLabel}
            </span>

            <h1 className="font-display text-2xl font-bold uppercase leading-[1.05] tracking-wide text-white drop-shadow-md sm:text-4xl lg:text-5xl">
              Blue Jays Shop
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-blue-100/90 drop-shadow sm:text-base">
              Gear Up. Show Up. Rep Your Team.
            </p>

            <div className="relative z-10 mt-4 max-w-lg rounded-2xl bg-white p-2 shadow-2xl shadow-black/30 ring-1 ring-black/5 sm:mt-5">
              <SearchBar value={searchValue} onChange={onSearchChange} placeholder="What are you looking for?" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
