'use client'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import HomeHero from '@/components/home/HomeHero'
import type { Slide as HeroSlide } from '@/components/shop/HeroSlideshow'
import FanTestimonials from '@/components/home/FanTestimonials'
import PartnerLogoMarquee from '@/components/ui/PartnerLogoMarquee'
import LetsGoJaysWatermark from '@/components/ui/LetsGoJaysWatermark'

export default function HomePageClient({ initialHeroSlides }: { initialHeroSlides?: HeroSlide[] }) {
  const { t } = useLanguage()
  const h = t.home
  const [isGameDayToday, setIsGameDayToday] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/game-days/next')
      .then((res) => (res.ok ? res.json() : { gameDay: null }))
      .then((data) => {
        if (cancelled || !data?.gameDay?.date) return
        const now = new Date()
        const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
        const gameDate = new Date(data.gameDay.date)
        const gameDateUTC = Date.UTC(gameDate.getUTCFullYear(), gameDate.getUTCMonth(), gameDate.getUTCDate())
        if (gameDateUTC === today) setIsGameDayToday(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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
      <HomeHero isGameDayToday={isGameDayToday} initialSlides={initialHeroSlides} />

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

        {/* ── Stadium Policy Notice — game days only ─────────────── */}
        {isGameDayToday && (
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
        )}

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
