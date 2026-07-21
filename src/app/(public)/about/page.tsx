'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Handshake, Landmark } from 'lucide-react'
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
        {/* glow orbs, echoes Home Hero */}
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #C2440C 0%, #8B1A1A 40%, transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #D4540A 0%, #7B1818 50%, transparent 75%)' }}
        />
        {/* diagonal stripe pattern, echoes Home Hero */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            background:
              'repeating-linear-gradient(-45deg, #C2440C 0, #C2440C 1px, transparent 0, transparent 50%)',
            backgroundSize: '40px 40px',
          }}
        />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 top-[2px] h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(30, 39, 97, 0.8) 0%, transparent 100%)' }}
        />

        <BrandWatermarks className="z-0" />
        <LetsGoJaysWatermark className="z-0" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-14 sm:pt-32 sm:pb-20 text-center">
          <div className="mb-5 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Landmark className="h-3 w-3 text-blue-200" />
              <span className="font-display text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">
                {a.heroSupra}
              </span>
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-wide leading-tight mb-4">
            Explore{' '}
            <span className="bg-gradient-to-r from-orange-500 via-jays-red to-amber-500 bg-clip-text text-transparent">
              Jays Shop
            </span>
          </h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {a.heroSubtitle}
          </p>
        </div>

        {/* Curved bottom edge */}
      </section>

      {/* ── Logo Evolution & Heritage ─────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-10">
            <p className="text-jays-navy/60 text-xs font-bold uppercase tracking-[0.3em] mb-3">
              Our Heritage
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy">
              The Evolution of a <span className="text-jays-red">Legacy</span>
            </h2>
            <p className="text-jays-steel text-sm mt-2 max-w-lg mx-auto">
              From 1977 to today — nearly five decades of iconic Blue Jays branding
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Logo Evolution timeline */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-jays-navy/50 font-semibold mb-3">1977 — Present · Logo Timeline</p>
              <Image
                src="/brand/logo-evolution.png"
                alt="Blue Jays Logo Evolution 1977-Present"
                width={600}
                height={750}
                className="w-full h-auto object-contain"
              />
            </div>

            {/* 50 Seasons & Milestones */}
            <div className="space-y-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-jays-navy/50 font-semibold mb-3">Celebrating · Season Milestones</p>
                <Image
                  src="/brand/50-seasons.png"
                  alt="Blue Jays 50 Seasons Anniversary Badges"
                  width={500}
                  height={500}
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Quick facts */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-jays-navy/50 mb-4">Heritage Highlights</p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { num: '1977', label: 'Founded' },
                    { num: '6', label: 'Iconic Logos' },
                    { num: '1992–93', label: 'World Series' },
                    { num: '2025', label: 'AL Champions' },
                  ].map((stat) => (
                    <div key={stat.label} className="border-l-2 border-jays-red/30 pl-3">
                      <p className="text-2xl font-display font-bold text-jays-navy">{stat.num}</p>
                      <p className="text-[10px] text-jays-steel uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Affiliated Brands ─────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-10">
            <p className="flex items-center justify-center gap-1.5 text-jays-navy/60 text-xs font-bold uppercase tracking-[0.3em] mb-3">
              <Handshake size={12} />
              {a.brandsBadge}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy">
              {a.brandsTitle} <span className="text-jays-red">{a.brandsTitleAccent}</span>
            </h2>
            <p className="text-jays-steel text-sm mt-2 max-w-lg mx-auto">
              {a.brandsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {BRAND_KEYS.map((brand) => (
              <div
                key={brand.name}
                className="flex items-center gap-4 py-3"
              >
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <Image
                    src={brand.src}
                    alt={brand.name}
                    width={brand.landscape ? 48 : 32}
                    height={32}
                    className="object-contain max-h-8"
                  />
                </div>
                <div>
                  <h3 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide">
                    {brand.name}
                  </h3>
                  <p className="text-jays-steel text-xs mt-0.5 leading-relaxed">{a[brand.descKey]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Timeline ───────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy text-center mb-2">
            {a.timelineTitle} <span className="text-jays-red">{a.timelineTitleAccent}</span>
          </h2>
          <p className="text-jays-steel text-center text-sm mb-10 max-w-lg mx-auto">
            {a.timelineSubtitle}
          </p>

          {/* Timeline cards */}
          <div className="relative">
            {/* Horizontal connector line (desktop) */}
            <div className="hidden sm:block absolute top-6 left-[5%] right-[5%] h-px bg-gray-200 z-0" />

            {/* Scrollable row on mobile, grid on desktop */}
            <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto pb-4 sm:pb-0 scrollbar-hide snap-x snap-mandatory">
              {MILESTONES.map((m) => (
                <div
                  key={m.year}
                  className={`group relative snap-start shrink-0 w-[75vw] sm:w-auto transition-all duration-300 ${
                    m.trophy
                      ? 'bg-jays-navy text-white rounded-2xl'
                      : 'text-jays-navy border-t-2 border-jays-navy/10'
                  }`}
                >
                  <div className="px-4 py-4">
                    {/* Year + trophy */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-display font-black text-2xl tabular-nums ${
                        m.trophy ? 'text-white' : 'text-jays-navy/80'
                      }`}>
                        {m.year}
                      </span>
                      {m.trophy ? (
                        <Trophy size={16} className="text-amber-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-jays-navy/20" />
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
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {/* City Connect Fridays */}
            <div className="group relative bg-jays-navy rounded-2xl p-8 text-white overflow-hidden hover:shadow-xl transition-all duration-500">
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <Image
                  src="/brand/city-connect-fridays.png"
                  alt="City Connect Fridays"
                  width={140}
                  height={140}
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain group-hover:scale-105 transition-transform duration-500"
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
            <div className="group relative p-8 overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <Image
                  src="/brand/ws-rings.png"
                  alt="1992 & 1993 World Series Championship Rings"
                  width={200}
                  height={200}
                  className="w-32 h-32 sm:w-36 sm:h-36 object-contain group-hover:scale-105 transition-transform duration-500"
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
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
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
