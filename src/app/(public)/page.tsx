'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import UpcomingMatchCard from '@/components/home/UpcomingMatchCard'
import FanTestimonials from '@/components/home/FanTestimonials'
import PartnerLogoMarquee from '@/components/ui/PartnerLogoMarquee'
import BrandWatermarks from '@/components/ui/BrandWatermarks'
import LetsGoJaysWatermark from '@/components/ui/LetsGoJaysWatermark'

export default function HomePage() {
  const { t } = useLanguage()
  const h = t.home

  const steps = [
    {
      step: '01',
      title: h.step1Title,
      body: h.step1Body,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      step: '02',
      title: h.step2Title,
      body: h.step2Body,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      step: '03',
      title: h.step3Title,
      body: h.step3Body,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
    },
  ]

  const faqs = [
    { q: h.faq1Q, a: h.faq1A },
    { q: h.faq2Q, a: h.faq2A },
    { q: h.faq3Q, a: h.faq3A },
    { q: h.faq4Q, a: h.faq4A },
    { q: h.faq5Q, a: h.faq5A },
  ]

  const trustItems = [
    { label: h.trustNoPayment, icon: '🔒' },
    { label: h.trust48Hour,    icon: '⏰' },
    { label: h.trustUpTo3,     icon: '🎽' },
    { label: h.trustInStore,   icon: '📍' },
  ]

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-jays-navy text-white sm:-mt-14">
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

        <div className="group absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-5 sm:top-5">
          <div className="absolute -top-1 right-12 animate-pulse text-xs text-yellow-300">✦</div>
          <div className="absolute -right-1 bottom-0 animate-pulse text-[8px] text-yellow-300/60" style={{ animationDelay: '0.5s' }}>✦</div>

          <div className="hidden rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md transition-all duration-300 group-hover:bg-white/15 sm:block">
            <p className="text-[9px] font-medium uppercase leading-tight tracking-[0.12em] text-blue-200/80">American League</p>
            <p className="font-display text-sm font-bold uppercase leading-tight tracking-wide text-white">Champions</p>
            <p className="text-[10px] font-semibold text-yellow-300/90">2025 ⚾</p>
          </div>

          <div className="relative">
            <div className="absolute -inset-1.5 rounded-full border border-dashed border-yellow-300/20 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-white/10 shadow-xl backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:border-yellow-300/30 sm:h-24 sm:w-24">
              <Image
                src="/brand/alcs-2025-round.png"
                alt="2025 ALCS Champions"
                width={120}
                height={120}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:pb-20 sm:pt-28">
          <div className="mb-3">
            <div className="inline-flex max-w-full items-center gap-2 px-2">
              <span className="h-px w-4 shrink-0 bg-gradient-to-r from-transparent to-amber-400/70 sm:w-6" aria-hidden="true" />
              <span
                className="whitespace-nowrap bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-[10px] font-semibold uppercase tracking-[0.15em] text-transparent drop-shadow-sm sm:text-xs sm:tracking-[0.25em]"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}
              >
                The Fanatic Experience
              </span>
              <span className="h-px w-4 shrink-0 bg-gradient-to-l from-transparent to-amber-400/70 sm:w-6" aria-hidden="true" />
            </div>
          </div>

          <div className="mb-5">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:px-4">
              <span className="h-2 w-2 shrink-0 rounded-full bg-jays-red animate-pulse" />
              <span className="font-display text-[10px] uppercase tracking-[0.1em] text-blue-200 whitespace-nowrap sm:text-xs sm:tracking-[0.2em]">
                Live Inventory · Rogers Centre
              </span>
            </div>
          </div>

          <h1 className="mb-4 font-display text-4xl font-bold uppercase tracking-wide leading-[1.1] sm:text-6xl">
            {h.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-jays-red to-amber-500 bg-clip-text text-transparent">
              {h.heroTitle2}
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
            {h.heroSubtitle}
          </p>

          <div className="mx-auto mb-8 max-w-md">
            <UpcomingMatchCard />
          </div>

          <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-jays-red text-white font-display font-semibold uppercase tracking-wider text-base px-8 py-3 rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all shadow-lg"
            >
              {h.browseShop}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/my-holds"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-display font-semibold uppercase tracking-wider text-sm px-6 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-all"
            >
              {h.viewMyHolds}
            </Link>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 text-left text-xs text-blue-100/85 sm:grid-cols-3 sm:text-sm">
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

        <div className="absolute bottom-0 left-0 right-0">
          <div aria-hidden="true" className="absolute inset-x-0 bottom-[6px] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent sm:bottom-[10px]" />
          <svg viewBox="0 0 1440 48" fill="none" className="h-6 w-full sm:h-10">
            <path d="M0 48L1440 48L1440 0C1200 40 240 40 0 0L0 48Z" fill="#F0F4FA" />
          </svg>
        </div>
      </section>

      
      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-jays-ice py-16 sm:py-20">
        <LetsGoJaysWatermark color="navy" density="light" />
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-px w-6 shrink-0 bg-gradient-to-r from-transparent to-jays-red/50" aria-hidden="true" />
            <span className="text-[10px] font-display font-bold uppercase tracking-[0.25em] text-jays-red">
              Simple &amp; Fast
            </span>
            <span className="h-px w-6 shrink-0 bg-gradient-to-l from-transparent to-jays-red/50" aria-hidden="true" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold uppercase text-jays-navy text-center mb-3">
            {h.howItWorksTitle}
          </h2>
          <p className="text-jays-steel text-center text-base sm:text-lg mb-10">
            {h.howItWorksSubtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((item) => (
              <div
                key={item.step}
                className="group relative bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center transition-all duration-300 hover:shadow-[0_20px_40px_-8px_rgba(19,74,142,0.15)] hover:-translate-y-1.5 ring-1 ring-black/[0.02]"
              >
                <span className="absolute right-5 top-5 font-display text-3xl font-bold text-jays-navy/[0.06] group-hover:text-jays-navy/[0.10] transition-colors">
                  {item.step}
                </span>
                <div className="relative w-14 h-14 bg-gradient-to-br from-jays-navy to-jays-royal text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-jays-navy/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {item.icon}
                </div>
                <h3 className="font-display font-bold text-xl text-jays-navy uppercase mb-3">
                  {item.title}
                </h3>
                <p className="text-jays-steel text-sm sm:text-base leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* ── Stadium Policy Notice ─────────────────────────────── */}
          <div className="mt-10 rounded-2xl border border-amber-200/60 bg-[#FFFDF4] px-6 py-5 shadow-sm">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-display font-bold text-sm sm:text-base uppercase tracking-wide text-amber-900 mb-1.5">
                  {h.stadiumPolicyTitle}
                </h3>
                <p className="text-amber-800/90 text-sm sm:text-base leading-relaxed">
                  {h.stadiumPolicyBody}
                </p>
              </div>
            </div>
          </div>
          {/* ── Partner Marquee ─────────────────────────────────────────── */}
          <div className="mt-14">
            <PartnerLogoMarquee />
          </div>

        </div>
      </section>

      {/* ── Trust Strip ─────────────────────────────────────────── */}
      <section className="bg-jays-ice border-t border-gray-200 px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-4 sm:gap-5">
          {trustItems.map(({ label, icon }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-full bg-white pl-2 pr-4 py-2 shadow-sm ring-1 ring-black/[0.03] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-jays-navy/[0.06] text-base">
                {icon}
              </span>
              <span className="text-sm font-medium text-jays-navy">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <FanTestimonials />

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-jays-royal text-white px-4 py-14 sm:py-16">
        <LetsGoJaysWatermark color="white" density="light" />
        <div className="relative max-w-3xl mx-auto">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-px w-6 shrink-0 bg-gradient-to-r from-transparent to-amber-400/60" aria-hidden="true" />
            <span className="text-[10px] font-display font-bold uppercase tracking-[0.25em] text-amber-300">
              Good To Know
            </span>
            <span className="h-px w-6 shrink-0 bg-gradient-to-l from-transparent to-amber-400/60" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide mb-8 text-center">
            {h.faqTitle}
          </h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl bg-white/[0.06] ring-1 ring-white/10 open:bg-white/[0.09] open:ring-white/20 transition-colors duration-300"
              >
                <summary className="flex justify-between items-center gap-3 px-5 py-4 cursor-pointer list-none font-semibold text-sm hover:text-blue-200 transition-colors">
                  {item.q}
                  <svg
                    className="w-4 h-4 shrink-0 ml-3 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-4 text-blue-200 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
