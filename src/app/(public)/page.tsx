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
    <div className="bg-jays-ice">
      {/* ── Hero — card-based, matches the Shop category banner treatment ── */}
      <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-jays-navy via-jays-royal to-jays-navy text-white shadow-xl ring-1 ring-black/5">
          {/* subtle dotted texture, matches CategoryBanner */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '18px 18px',
            }}
          />
          {/* two soft glow orbs — the same layered feel as the shop banners, no extra stripe overlay */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-jays-red/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -bottom-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />

          <BrandWatermarks className="z-0" />
          <LetsGoJaysWatermark className="z-0" />

          {/* Champions badge — simplified, no spin ring / sparkle marks */}
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

          <div className="relative z-10 mx-auto max-w-2xl px-6 pb-12 pt-14 text-center sm:px-8 sm:pb-16 sm:pt-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm sm:text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red animate-pulse" />
              Live Inventory · Rogers Centre
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
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {steps.map((item) => (
            <div
              key={item.step}
              className="group relative bg-white rounded-3xl p-7 sm:p-8 shadow-sm ring-1 ring-black/[0.03] text-center transition-shadow duration-300 hover:shadow-lg"
            >
              <span className="absolute right-5 top-5 font-display text-3xl font-bold text-jays-navy/[0.06]">
                {item.step}
              </span>
              <div className="relative w-14 h-14 bg-gradient-to-br from-jays-navy to-jays-royal text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-jays-navy/10">
                {item.icon}
              </div>
              <h3 className="font-display font-bold text-xl text-jays-navy uppercase mb-2.5">
                {item.title}
              </h3>
              <p className="text-jays-steel text-sm sm:text-base leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* ── Stadium Policy Notice ─────────────────────────────── */}
        <div className="mt-8 rounded-2xl border border-blue-200/60 bg-blue-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-jays-royal shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base uppercase tracking-wide text-jays-navy mb-1.5">
                {h.stadiumPolicyTitle}
              </h3>
              <p className="text-blue-900/80 text-sm sm:text-base leading-relaxed">
                {h.stadiumPolicyBody}
              </p>
            </div>
          </div>
        </div>

        {/* ── Partner Marquee ─────────────────────────────────────── */}
        <div className="mt-12">
          <PartnerLogoMarquee />
        </div>
      </section>

      {/* ── Trust Strip ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-3 rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-black/[0.03] sm:gap-4">
          {trustItems.map(({ label, icon }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-full bg-jays-ice pl-2 pr-4 py-2"
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
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-jays-royal text-white px-6 py-10 sm:px-10 sm:py-12 shadow-xl ring-1 ring-black/5">
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
        </div>
      </section>
    </div>
  )
}
