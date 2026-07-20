'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import UpcomingMatchCard from '@/components/home/UpcomingMatchCard'
import BrandWatermarks from '@/components/ui/BrandWatermarks'
import LetsGoJaysWatermark from '@/components/ui/LetsGoJaysWatermark'
import HeroSlideshow from '@/components/shop/HeroSlideshow'

interface HomeHeroProps {
  isGameDayToday?: boolean
}

export default function HomeHero({ isGameDayToday = false }: HomeHeroProps) {
  const { t } = useLanguage()
  const h = t.home

  return (
    <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      {/* Standard hero banner: fixed responsive container with edge-to-edge
          background image using object-cover. Cropping is acceptable to keep
          proportions and layout stable. */}
      <div className="relative max-h-[85vh] min-h-[460px] overflow-hidden rounded-3xl bg-gradient-to-br from-jays-navy via-jays-royal to-jays-navy text-white shadow-xl ring-1 ring-black/5 sm:min-h-[520px]">
        <HeroSlideshow scope="HOME" />

        {/* subtle dotted texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[2] opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 z-[2] h-56 w-56 rounded-full bg-jays-red/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -bottom-24 z-[2] h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

        <BrandWatermarks className="z-[2]" />
        <LetsGoJaysWatermark className="z-[2]" />

        <div className="absolute right-4 top-4 z-10 hidden items-center gap-2 sm:flex">
          <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">
            <p className="text-[9px] font-medium uppercase leading-tight tracking-[0.12em] text-blue-200/80">American League</p>
            <p className="font-display text-sm font-bold uppercase leading-tight tracking-wide text-white">Champions</p>
            <p className="text-[10px] font-semibold text-yellow-300/90">2025 ⚾</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-white/10 shadow-lg sm:h-16 sm:w-16">
            <Image
              src="/brand/alcs-2025-round.png"
              alt="2025 ALCS Champions"
              width={80}
              height={80}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-6 pb-8 pt-10 text-center sm:px-8 sm:pb-10 sm:pt-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm sm:text-xs">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red animate-pulse" />
            Live Inventory · Rogers Centre
          </div>

          <h1 className="mb-3 font-display text-3xl font-bold uppercase tracking-wide leading-[1.08] sm:text-5xl">
            {h.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-jays-red to-amber-500 bg-clip-text text-transparent">
              {h.heroTitle2}
            </span>
          </h1>

          <p className="mx-auto mb-5 max-w-2xl text-sm leading-snug text-blue-100 sm:text-base">
            {h.heroSubtitle}
          </p>

          <div className="mx-auto mb-5 max-w-md">
            <UpcomingMatchCard />
          </div>

          <div className="mb-5 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-jays-red text-white font-display font-semibold uppercase tracking-wider text-sm sm:text-base px-7 py-2.5 sm:px-8 sm:py-3 rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all shadow-lg"
            >
              {h.browseShop}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/my-holds"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-display font-semibold uppercase tracking-wider text-xs sm:text-sm px-6 py-2.5 sm:py-3 rounded-xl hover:border-white hover:bg-white/10 transition-all"
            >
              {h.viewMyHolds}
            </Link>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-2.5 text-left text-xs text-blue-100/85 sm:grid-cols-3 sm:text-sm">
            <div className="flex items-center gap-1.5">
              <span>🏟️</span>
              <span>12 store locations</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>⏰</span>
              <span>3-hr express holds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>💳</span>
              <span>Free to reserve</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
