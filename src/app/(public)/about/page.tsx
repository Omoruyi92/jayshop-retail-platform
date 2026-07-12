'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Handshake } from 'lucide-react'
import BrandWatermarks from '@/components/ui/BrandWatermarks'
import LetsGoJaysWatermark from '@/components/ui/LetsGoJaysWatermark'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const BRAND_KEYS = [
  { src: '/brand/partners/nike.png',              name: 'Nike',              descKey: 'brandDescNike'      as const, landscape: true },
  { src: '/brand/partners/new-era.png',           name: 'New Era',           descKey: 'brandDescNewEra'    as const, landscape: false },
  { src: '/brand/partners/fanatics.png',          name: 'Fanatics',          descKey: 'brandDescFanatics'  as const, landscape: true },
  { src: '/brand/partners/levelwear.png',         name: 'Levelwear',         descKey: 'brandDescLevelwear' as const, landscape: false },
  { src: '/brand/partners/47brand.jpg',           name: "'47 Brand",         descKey: 'brandDesc47'        as const, landscape: false },
  { src: '/brand/partners/roots.jpg',             name: 'Roots',             descKey: 'brandDescRoots'     as const, landscape: true },
  { src: '/brand/partners/peace-collective.png',  name: 'Peace Collective',  descKey: 'brandDescPeace'     as const, landscape: false },
  { src: '/brand/partners/mitchell-ness.png',     name: 'Mitchell & Ness',   descKey: 'brandDescMitchell'  as const, landscape: true },
  { src: '/brand/partners/bulletin.png',          name: 'Bulletin',          descKey: 'brandDescBulletin'  as const, landscape: false },
]

type MilestoneKey =
  | 'milestone1977' | 'milestone1985' | 'milestone1989'
  | 'milestone1992' | 'milestone1993'
  | 'milestone2015' | 'milestone2016' | 'milestone2025'
  | 'milestoneToday'

const MILESTONES: { year: string; key: MilestoneKey; trophy?: boolean }[] = [
  { year: '1977', key: 'milestone1977' },
  { year: '1985', key: 'milestone1985' },
  { year: '1989', key: 'milestone1989' },
  { year: '1992', key: 'milestone1992', trophy: true },
  { year: '1993', key: 'milestone1993', trophy: true },
  { year: '2015', key: 'milestone2015' },
  { year: '2016', key: 'milestone2016' },
  { year: '2025', key: 'milestone2025', trophy: true },
  { year: 'Today', key: 'milestoneToday' },
]

export default function AboutPage() {
  const { t } = useLanguage()
  const a = t.about

  return (
    <div>
      {/* ── Hero Banner ────────────────────────────────────────────── */}
      <section className="relative bg-jays-navy text-white overflow-hidden sm:-mt-14">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 40px, rgba(255,255,255,.04) 40px, rgba(255,255,255,.04) 42px)',
          }}
        />
        <BrandWatermarks className="z-0" />
        <LetsGoJaysWatermark className="z-0" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-14 sm:pt-32 sm:pb-20 text-center">
          <p className="font-display text-xs sm:text-sm uppercase tracking-[0.35em] text-blue-300 mb-3">
            {a.heroSupra}
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-wide leading-tight mb-4">
            Explore{' '}
            <span className="text-jays-red">Jays Shop</span>
          </h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {a.heroSubtitle}
          </p>
        </div>

        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-8 sm:h-12">
            <path d="M0 60L1440 60L1440 0C1200 50 240 50 0 0L0 60Z" fill="#f0f4f8" />
          </svg>
        </div>
      </section>

      {/* ── Logo Evolution & Heritage ─────────────────────────────── */}
      <section className="bg-gradient-to-b from-jays-ice to-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-jays-navy/5 text-jays-navy text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3">
              ⚾ Our Heritage
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy">
              The Evolution of a <span className="text-jays-red">Legacy</span>
            </h2>
            <p className="text-jays-steel text-sm mt-2 max-w-lg mx-auto">
              From 1977 to today — nearly five decades of iconic Blue Jays branding
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Logo Evolution timeline */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-jays-navy/20 via-jays-red/10 to-jays-royal/20 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500">
                <div className="bg-gradient-to-r from-jays-navy via-jays-royal to-jays-navy px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200/70 font-medium">1977 — Present</p>
                      <p className="text-sm font-display font-bold text-white uppercase tracking-wide">Logo Timeline</p>
                    </div>
                    <div className="flex gap-1">
                      {['✦', '⋆', '✦'].map((s, i) => (
                        <span key={i} className="text-yellow-300/50 text-[10px] animate-pulse" style={{ animationDelay: `${i * 0.4}s` }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <Image
                    src="/brand/logo-evolution.png"
                    alt="Blue Jays Logo Evolution 1977-Present"
                    width={600}
                    height={750}
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* 50 Seasons & Milestones */}
            <div className="space-y-5">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-jays-royal/15 to-yellow-300/10 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500">
                  <div className="bg-gradient-to-r from-jays-royal to-jays-navy px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200/70 font-medium">Celebrating</p>
                        <p className="text-sm font-display font-bold text-white uppercase tracking-wide">Season Milestones</p>
                      </div>
                      <span className="text-yellow-300/60 text-xs animate-pulse">🏆</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <Image
                      src="/brand/50-seasons.png"
                      alt="Blue Jays 50 Seasons Anniversary Badges"
                      width={500}
                      height={500}
                      className="w-full h-auto object-contain rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Quick facts card */}
              <div className="bg-gradient-to-br from-jays-navy to-jays-royal rounded-2xl p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-200/70">Heritage Highlights</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { num: '1977', label: 'Founded' },
                      { num: '6', label: 'Iconic Logos' },
                      { num: '1992–93', label: 'World Series' },
                      { num: '2025', label: 'AL Champions' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center hover:bg-white/15 transition-colors">
                        <p className="text-lg font-display font-bold text-white">{stat.num}</p>
                        <p className="text-[10px] text-blue-200/70 uppercase tracking-wider">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Affiliated Brands ─────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 bg-jays-navy/5 text-jays-navy text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3">
              <Handshake size={12} />
              {a.brandsBadge}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy">
              {a.brandsTitle} <span className="text-jays-red">{a.brandsTitleAccent}</span>
            </h2>
            <p className="text-jays-steel text-sm mt-2 max-w-lg mx-auto">
              {a.brandsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BRAND_KEYS.map((brand) => (
              <div
                key={brand.name}
                className="group relative bg-gradient-to-br from-white to-jays-ice rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-jays-navy/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-jays-navy via-jays-red to-jays-navy opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center shrink-0 group-hover:shadow-md transition-shadow">
                    <Image
                      src={brand.src}
                      alt={brand.name}
                      width={brand.landscape ? 48 : 32}
                      height={32}
                      className="object-contain max-h-8"
                    />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide group-hover:text-jays-red transition-colors">
                      {brand.name}
                    </h3>
                    <p className="text-jays-steel text-xs mt-0.5 leading-relaxed">{a[brand.descKey]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ───────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-jays-ice to-white overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.02]" aria-hidden="true" style={{
          backgroundImage: 'radial-gradient(circle, #134A8E 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy text-center mb-2">
            {a.timelineTitle} <span className="text-jays-red">{a.timelineTitleAccent}</span>
          </h2>
          <p className="text-jays-steel text-center text-sm mb-10 max-w-lg mx-auto">
            {a.timelineSubtitle}
          </p>

          {/* Banner-style timeline cards */}
          <div className="relative">
            {/* Horizontal connector line (desktop) */}
            <div className="hidden sm:block absolute top-6 left-[5%] right-[5%] h-px bg-gradient-to-r from-jays-navy/20 via-jays-red/30 to-jays-navy/20 z-0" />

            {/* Scrollable row on mobile, grid on desktop */}
            <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto pb-4 sm:pb-0 scrollbar-hide snap-x snap-mandatory">
              {MILESTONES.map((m) => (
                <div
                  key={m.year}
                  className={`group relative snap-start shrink-0 w-[75vw] sm:w-auto rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    m.trophy
                      ? 'bg-gradient-to-br from-jays-navy to-jays-royal text-white shadow-md'
                      : 'bg-white text-jays-navy border border-gray-100 shadow-sm'
                  }`}
                >
                  {/* Top accent */}
                  {m.trophy && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-jays-red via-amber-500 to-jays-red" />
                  )}

                  <div className="px-4 py-4">
                    {/* Year + trophy */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-display font-black text-2xl tabular-nums ${
                        m.trophy ? 'text-white' : 'text-jays-navy/80'
                      }`}>
                        {m.year}
                      </span>
                      {m.trophy ? (
                        <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center ring-1 ring-white/20">
                          <Trophy size={16} className="text-amber-400" />
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-jays-navy/20 group-hover:bg-jays-royal transition-colors" />
                      )}
                    </div>

                    {/* Description */}
                    <p className={`text-sm leading-relaxed ${
                      m.trophy ? 'text-blue-100 font-medium' : 'text-jays-steel'
                    }`}>
                      {a[m.key]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── City Connect Fridays & Championship Rings ───────────────── */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* City Connect Fridays */}
            <div className="group relative bg-gradient-to-br from-jays-navy to-jays-royal rounded-2xl border border-gray-100 p-6 text-white overflow-hidden hover:shadow-xl transition-all duration-500">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <Image
                  src="/brand/city-connect-fridays.png"
                  alt="City Connect Fridays"
                  width={140}
                  height={140}
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
                />
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide">
                  City Connect <span className="text-jays-red">Fridays</span>
                </h3>
                <p className="text-blue-100 text-sm leading-relaxed max-w-sm">
                  Every Friday, rep the exclusive City Connect collection — a bold navy-and-red tribute to Toronto&apos;s streets, transit lines, and the CN Tower silhouette. Limited drops, only while supplies last.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 bg-white text-jays-navy font-display font-semibold text-xs uppercase tracking-wide px-5 py-2 rounded-full hover:bg-blue-100 transition-colors"
                >
                  Shop City Connect
                </Link>
              </div>
            </div>

            {/* World Series Championship Rings */}
            <div className="group relative bg-gradient-to-br from-white to-jays-ice rounded-2xl border border-gray-100 p-6 overflow-hidden hover:shadow-xl transition-all duration-500">
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <Image
                  src="/brand/ws-rings.png"
                  alt="1992 & 1993 World Series Championship Rings"
                  width={200}
                  height={200}
                  className="w-32 h-32 sm:w-36 sm:h-36 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
                />
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-jays-navy">
                  Back-to-Back <span className="text-jays-red">Champions</span>
                </h3>
                <p className="text-jays-steel text-sm leading-relaxed max-w-sm">
                  The 1992 and 1993 World Series rings stand as the crown jewels of Blue Jays history — the only back-to-back titles in franchise lore, encrusted with diamonds and forever etched into Toronto&apos;s baseball legacy.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 bg-jays-navy text-white font-display font-semibold text-xs uppercase tracking-wide px-5 py-2 rounded-full hover:bg-jays-royal transition-colors"
                >
                  Shop Championship Gear
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Championship Highlight ─────────────────────────────────── */}
      <section className="bg-jays-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy size={28} className="text-jays-red" />
            <Trophy size={28} className="text-jays-red" />
            <Trophy size={28} className="text-amber-400" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
            {a.champTitle}
          </h2>
          <p className="text-blue-200 max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
            {a.champBody}
          </p>
          <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 flex-wrap">
            <div className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-bold text-jays-red">1992</p>
              <p className="text-blue-300 text-xs uppercase tracking-wider mt-1">{a.champWS}</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-bold text-jays-red">1993</p>
              <p className="text-blue-300 text-xs uppercase tracking-wider mt-1">{a.champWS}</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-bold text-amber-400">2025</p>
              <p className="text-blue-300 text-xs uppercase tracking-wider mt-1">{a.champALCS}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="bg-jays-ice">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy mb-3">
            {a.ctaTitle}
          </h2>
          <p className="text-jays-steel text-sm max-w-md mx-auto mb-6">
            {a.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-jays-red text-white font-display font-semibold uppercase tracking-wide px-8 py-3 rounded-xl shadow-md hover:bg-red-600 transition-colors"
            >
              {a.ctaShop}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border-2 border-jays-navy text-jays-navy font-display font-semibold uppercase tracking-wide px-8 py-3 rounded-xl hover:bg-jays-navy hover:text-white transition-colors"
            >
              {a.ctaBack}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
