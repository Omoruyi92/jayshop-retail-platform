'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n/LanguageContext'

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
      <section className="relative bg-jays-navy text-white overflow-hidden">
        {/* Subtle diagonal accent */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{
            background:
              'repeating-linear-gradient(-45deg, #E8291C 0, #E8291C 1px, transparent 0, transparent 50%)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
          {/* Brand icon */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image
              src="/brand/logo.png"
              alt="Blue Jays logo"
              width={128}
              height={128}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-contain"
              priority
            />
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-wide leading-tight mb-5">
            {h.heroTitle1}
            <br />
            <span className="text-jays-red">{h.heroTitle2}</span>
          </h1>

          <p className="text-blue-100 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            {h.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-jays-red text-white font-display font-semibold uppercase tracking-wider text-lg px-10 py-4 rounded-xl hover:bg-red-600 active:scale-[0.98] transition-all shadow-lg"
            >
              {h.browseShop}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/my-holds"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-display font-semibold uppercase tracking-wider text-base px-8 py-4 rounded-xl hover:border-white hover:bg-white/10 transition-all"
            >
              {h.viewMyHolds}
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="font-display text-2xl font-bold uppercase text-jays-navy text-center mb-2">
          {h.howItWorksTitle}
        </h2>
        <p className="text-jays-steel text-center text-sm mb-10">
          {h.howItWorksSubtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl p-6 shadow-sm text-center border border-gray-100 hover:border-jays-navy hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-jays-navy text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                {item.icon}
              </div>
              <p className="font-mono text-xs text-jays-steel mb-1">{item.step}</p>
              <h3 className="font-display font-semibold text-lg text-jays-navy uppercase mb-2">
                {item.title}
              </h3>
              <p className="text-jays-steel text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* ── Stadium Policy Notice ─────────────────────────────── */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 text-xl mt-0.5" aria-hidden="true">⚠️</span>
            <div>
              <h3 className="font-display font-semibold text-sm uppercase tracking-wide text-amber-800 mb-1">
                {h.stadiumPolicyTitle}
              </h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                {h.stadiumPolicyBody}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border-2 border-jays-navy text-jays-navy font-display font-semibold uppercase tracking-wide px-7 py-3 rounded-xl hover:bg-jays-navy hover:text-white transition-colors"
          >
            {h.viewAllProducts}
          </Link>
        </div>
      </section>

      {/* ── Trust Strip ─────────────────────────────────────────── */}
      <section className="bg-jays-ice border-t border-gray-200 px-4 py-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-sm text-jays-steel">
          {trustItems.map(({ label, icon }) => (
            <div key={label} className="flex items-center gap-2 font-medium">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="bg-jays-royal text-white px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide mb-8 text-center">
            {h.faqTitle}
          </h2>
          <div className="space-y-0">
            {faqs.map((item, i) => (
              <details
                key={i}
                className="group border-b border-blue-600 last:border-0"
              >
                <summary className="flex justify-between items-center py-4 cursor-pointer list-none font-semibold text-sm hover:text-blue-200 transition-colors">
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
                <p className="pb-4 text-blue-200 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
