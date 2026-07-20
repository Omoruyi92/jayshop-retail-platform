'use client'

import Image from 'next/image'
import SearchBar from '@/components/shop/SearchBar'
import HeroSlideshow from '@/components/shop/HeroSlideshow'

export default function ShopHero({
  searchValue,
  onSearchChange,
  liveLabel,
  livePulse,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
  liveLabel: string
  livePulse: boolean
}) {
  return (
    <section className="relative max-h-[60vh] min-h-[360px] overflow-hidden bg-gradient-to-br from-jays-navy via-jays-royal to-jays-navy sm:max-h-[55vh] lg:min-h-[420px]">
      {/* Standard hero banner: edge-to-edge background image using object-cover
          inside a fixed responsive container. Cropping preserves proportions. */}
      <HeroSlideshow scope="SHOP" imagePosition="top" />

      {/* sunburst rays, premium stadium-marquee feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-conic-gradient(from 0deg at 50% -20%, #FFFFFF 0deg 4deg, transparent 4deg 16deg)',
        }}
      />
      {/* subtle dotted texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #FFFFFF 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* soft glow orbs */}
      <div aria-hidden className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full bg-jays-red/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: copy */}
          <div className="w-full max-w-xl">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-display font-semibold uppercase tracking-[0.15em] text-emerald-300 transition-opacity duration-500 ${
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

            <h1 className="font-display text-3xl font-bold uppercase leading-[1.05] tracking-wide text-white sm:text-5xl">
              Blue Jays Shop
            </h1>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-100/90 sm:text-base">
              Rogers Centre
            </p>

            {/* Promo tagline pill, marquee-style */}
            <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 shadow-lg shadow-black/10 backdrop-blur-sm sm:gap-2.5 sm:px-5 sm:py-3">
              <span className="font-display text-xs font-bold uppercase tracking-[0.12em] text-white sm:text-sm">Gear Up.</span>
              <span className="font-display text-xs font-bold uppercase tracking-[0.12em] text-amber-300 sm:text-sm">Show Up.</span>
              <span className="font-display text-xs font-bold uppercase tracking-[0.12em] text-blue-200 sm:text-sm">Rep Your Team.</span>
            </div>
          </div>

          {/* Right: mascot */}
          <div className="relative mx-auto shrink-0 sm:mx-0">
            <div aria-hidden className="absolute inset-0 -m-6 rounded-full bg-white/10 blur-2xl" />
            <Image
              src="/brand/ace-mascot.png"
              alt="Ace the Blue Jays mascot"
              width={260}
              height={260}
              priority
              className="relative h-32 w-32 object-contain drop-shadow-2xl sm:h-48 sm:w-48 lg:h-64 lg:w-64"
            />
          </div>
        </div>

        {/* Prominent search bar, elevated white pill anchored near the hero's edge */}
        <div className="relative z-10 mx-auto mt-8 max-w-2xl rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 ring-1 ring-black/5 sm:mt-10">
          <SearchBar value={searchValue} onChange={onSearchChange} placeholder="What are you looking for?" />
        </div>
      </div>
    </section>
  )
}
