'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, MapPin, Radio, Users, Shield, Heart, Star, Award, Truck, BadgeCheck } from 'lucide-react'
import BrandWatermarks from '@/components/ui/BrandWatermarks'
import LetsGoJaysWatermark from '@/components/ui/LetsGoJaysWatermark'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function AboutUsPage() {
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
            Who We Are
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-wide leading-tight mb-4">
            About <span className="text-jays-red">Us</span>
          </h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            More than a store — we&apos;re fans first. Built by Blue Jays supporters, for Blue Jays supporters.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-8 sm:h-12">
            <path d="M0 60L1440 60L1440 0C1200 50 240 50 0 0L0 60Z" fill="#f0f4f8" />
          </svg>
        </div>
      </section>

      {/* ── Our Story ──────────────────────────────────────────────── */}
      <section className="bg-jays-ice">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-jays-red/10 text-jays-red text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                <Heart size={12} />
                Our Story
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy leading-snug mb-4">
                Born from a Love of <span className="text-jays-red">Blue Jays Baseball</span>
              </h2>
              <p className="text-jays-steel leading-relaxed mb-4">
                Jays Shop started with a simple idea: every fan deserves easy access to official, high-quality Blue Jays
                merchandise — right at the stadium, without the hassle. What began as a passion project by lifelong fans
                has grown into the go-to destination for game-day gear at Rogers Centre.
              </p>
              <p className="text-jays-steel leading-relaxed">
                We know what it feels like to be in the stands, cheering on the boys in blue. That passion drives
                everything we do — from the products we carry to the way we treat every single customer who walks
                through our doors.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-jays-navy/15 animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-3 rounded-full border border-jays-red/20" />
                <div className="absolute inset-6 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <Image
                    src="/brand/logo.png"
                    alt="Toronto Blue Jays"
                    width={140}
                    height={140}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Values ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-jays-ice to-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-jays-navy/5 text-jays-navy text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3">
              <Star size={12} />
              What We Stand For
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy">
              Our <span className="text-jays-red">Values</span>
            </h2>
            <p className="text-jays-steel text-sm mt-2 max-w-lg mx-auto">
              The principles that guide every interaction, every product, and every game day
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Heart,
                title: 'Fan-First Mentality',
                body: 'Every decision starts with the fan. We listen, adapt, and always put your experience first because we\'re fans too.',
                accent: 'from-red-500 to-jays-red',
              },
              {
                icon: BadgeCheck,
                title: '100% Authentic',
                body: 'Every item is officially licensed and sourced directly from trusted brand partners. No knockoffs, ever.',
                accent: 'from-jays-navy to-jays-royal',
              },
              {
                icon: Users,
                title: 'Community Driven',
                body: 'We\'re part of the Blue Jays family. We support local initiatives and believe baseball brings people together.',
                accent: 'from-jays-royal to-blue-500',
              },
              {
                icon: Award,
                title: 'Quality Over Quantity',
                body: 'We curate our collection carefully — only the best gear from top brands like Nike, New Era, Roots, and more.',
                accent: 'from-amber-500 to-orange-500',
              },
              {
                icon: Shield,
                title: 'Trust & Transparency',
                body: 'Real-time inventory, clear pricing, no hidden fees. What you see is what you get — honest and upfront.',
                accent: 'from-emerald-500 to-green-600',
              },
              {
                icon: Truck,
                title: 'Seamless Experience',
                body: 'From online holds to in-store pickup, we\'ve made shopping as smooth as a Vladimir Jr. home run swing.',
                accent: 'from-purple-500 to-indigo-500',
              },
            ].map(({ icon: Icon, title, body, accent }) => (
              <div
                key={title}
                className="group relative bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-10 h-10 bg-gradient-to-br ${accent} text-white rounded-lg flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-display font-semibold text-jays-navy text-base mb-1">{title}</h3>
                <p className="text-jays-steel text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Shop With Us ───────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 bg-jays-red/10 text-jays-red text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3">
              <ShoppingBag size={12} />
              Why Jays Shop
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy">
              Why Shop <span className="text-jays-red">With Us?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: '🏟️',
                title: 'Stadium Convenience',
                body: 'Located right inside Rogers Centre — browse online, hold your item, and pick it up on game day. No shipping, no waiting.',
              },
              {
                icon: '✅',
                title: 'Official Licensed Gear',
                body: 'Every product carries official MLB licensing. Jerseys, hats, collectibles — all verified and authenticated.',
              },
              {
                icon: '💰',
                title: 'Fair, Transparent Pricing',
                body: 'Competitive prices in CAD with no surprise charges. Staff and military discounts available in-store.',
              },
              {
                icon: '🔄',
                title: 'Hassle-Free Returns',
                body: 'Not the right fit? Our return policy makes exchanges and returns simple and stress-free.',
              },
              {
                icon: '📱',
                title: 'Real-Time Inventory',
                body: 'See exactly what\'s available in each size and location before you visit. No wasted trips.',
              },
              {
                icon: '🤝',
                title: 'Customer Service That Cares',
                body: 'Our team are fellow fans who genuinely care about your experience. We go the extra mile — every time.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex gap-4 bg-jays-ice/50 rounded-xl p-5 border border-gray-100 hover:border-jays-navy/15 hover:shadow-sm transition-all">
                <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
                <div>
                  <h3 className="font-display font-semibold text-jays-navy text-sm mb-1">{title}</h3>
                  <p className="text-jays-steel text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jr. Jays Sunday ─────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-white to-jays-ice">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                🧢 Jr. Jays Sunday
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy leading-snug mb-4">
                For Our <span className="text-jays-red">Youngest Fans</span>
              </h2>
              <p className="text-jays-steel leading-relaxed mb-4">
                Every Sunday is Jr. Jays Sunday at the Jays Shop! We believe the love of baseball starts early, and
                we&apos;re proud to welcome young fans who share our passion for the Blue Jays. From tiny jerseys
                to kid-sized caps, we make sure the next generation is geared up and game-day ready.
              </p>
              <p className="text-jays-steel leading-relaxed mb-4">
                Young fans who visit on Sundays enjoy <span className="font-semibold text-jays-navy">20% off all youth merchandise</span> —
                because we value and appreciate every young shopper who steps into our store. Their excitement and
                energy remind us why we do what we do.
              </p>
              <Link href="/discounts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                View all discounts
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-8 border border-sky-100">
                <div className="text-center">
                  <span className="text-5xl mb-3 block">🧢</span>
                  <p className="font-display text-4xl font-black text-jays-navy">20<span className="text-jays-red">%</span></p>
                  <p className="text-xs uppercase tracking-wider text-jays-steel font-semibold mt-1">Off Youth Merchandise</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Every Sunday
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pride & Inclusion ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-amber-400 via-green-500 via-blue-500 to-purple-600 opacity-[0.08]" />
        <div className="relative bg-white/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-3"
                style={{ background: 'linear-gradient(90deg, #ff000015, #ff800015, #ffff0015, #00800015, #0000ff15, #80008015)', color: '#5b21b6' }}>
                🏳️‍🌈 Pride & Inclusion
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy">
                Diversity Is Our <span className="text-jays-red">Strength</span>
              </h2>
              <p className="text-jays-steel text-sm mt-2 max-w-xl mx-auto leading-relaxed">
                At Jays Shop, we believe baseball is for everyone — and so is our store.
              </p>
            </div>

            <div className="max-w-2xl mx-auto bg-gradient-to-br from-jays-ice to-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <p className="text-jays-steel leading-relaxed mb-4">
                We proudly stand with the LGBTQ+ community and are committed to creating a space where
                <span className="font-semibold text-jays-navy"> every fan feels welcome, respected, and celebrated</span>.
                Baseball has always been about bringing people together — across backgrounds, identities, and experiences —
                and that spirit is at the heart of everything we do.
              </p>
              <p className="text-jays-steel leading-relaxed mb-4">
                From Pride Night celebrations at Rogers Centre to inclusive merchandise and welcoming service,
                we embrace diversity not just as a value, but as a fundamental part of who we are. Our team reflects the
                rich, diverse community of Toronto and Canada — and we&apos;re stronger because of it.
              </p>
              <p className="text-jays-steel leading-relaxed">
                Whether you&apos;re cheering from the 500s or shopping in Section 110, you belong here.
                <span className="font-semibold text-jays-navy"> Everyone&apos;s a Blue Jay.</span>
              </p>

              {/* Rainbow accent bar */}
              <div className="mt-6 h-1.5 rounded-full overflow-hidden flex">
                <div className="flex-1 bg-red-500" />
                <div className="flex-1 bg-orange-500" />
                <div className="flex-1 bg-yellow-400" />
                <div className="flex-1 bg-green-500" />
                <div className="flex-1 bg-blue-500" />
                <div className="flex-1 bg-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Commitment ─────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-jays-navy via-jays-royal to-jays-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
          <Shield size={32} className="mx-auto mb-4 text-amber-400" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
            Why You Can <span className="text-amber-400">Trust Us</span>
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto leading-relaxed text-sm sm:text-base mb-8">
            We&apos;re not just another merchandise store. We&apos;re an integral part of the Toronto Blue Jays game-day experience,
            committed to delivering authentic products with integrity and care.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { num: '100%', label: 'Officially Licensed' },
              { num: '9+', label: 'Brand Partners' },
              { num: '0', label: 'Counterfeit Products' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-5 border border-white/10 hover:bg-white/15 transition-colors">
                <p className="font-display text-3xl font-bold text-white mb-1">{stat.num}</p>
                <p className="text-[11px] text-blue-200/70 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
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
              href="/about"
              className="inline-flex items-center justify-center gap-2 border-2 border-jays-navy text-jays-navy font-display font-semibold uppercase tracking-wide px-8 py-3 rounded-xl hover:bg-jays-navy hover:text-white transition-colors"
            >
              Explore Our Store
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
