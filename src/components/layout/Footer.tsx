'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import MLBLogo from '@/components/ui/MLBLogo'
import FeedbackTab from '@/components/feedback/FeedbackTab'

/* ─── Icons ─────────────────────────────────────────────────────── */
function PolicyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function ReturnsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
function DiscountsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}
function ConcernsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}
function StoreLocationIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function SupportIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function AboutUsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function HeritageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  )
}
/* ─── Footer ────────────────────────────────────────────────────── */
export default function Footer() {
  const { t } = useLanguage()

  const navItemsLeft = [
    { href: '/policy', label: 'Store Policy', icon: PolicyIcon },
    { href: '/returns', label: 'Return Policy', icon: ReturnsIcon },
    { href: '/about-us', label: 'About Us', icon: AboutUsIcon },
  ]

  const navItemsRight = [
    { href: '/discounts', label: 'Discounts', icon: DiscountsIcon },
    { href: '/product-concerns', label: 'Product Concerns', icon: ConcernsIcon },
    { href: '/about', label: 'Our Heritage', icon: HeritageIcon },
  ]

  return (
    <footer className="bg-jays-royal text-white mt-auto overflow-x-hidden relative z-30 pb-20 sm:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-4 w-full min-w-0">
        {/* ── 3-column grid: Brand | Nav | Social+Newsletter ── */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-start min-w-0">

          {/* ── Col 1: Brand ─────────────────────────────────── */}
          <div className="space-y-0.5">
            <p className="font-display font-bold text-lg uppercase tracking-wider leading-tight">
              <span className="text-jays-red">Jays</span> Shop
            </p>
            <p className="text-blue-300 text-xs leading-snug">{t.footer.tagline}</p>
            <p className="text-blue-300 text-xs font-medium leading-snug">{t.footer.storeHours}</p>
            <p className="text-blue-300 text-xs flex items-center gap-1 leading-snug">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href="tel:+14163412904" className="hover:text-white transition-colors">Gate 5: 416.341.2904</a>
            </p>
            <a href="https://www.google.com/maps/search/?api=1&query=1+Blue+Jays+Way%2C+Toronto%2C+ON+M5V+1J4"
              target="_blank" rel="noopener noreferrer"
              className="text-blue-300 text-xs flex items-center gap-1 leading-snug hover:text-white transition-colors">
              <StoreLocationIcon className="w-3 h-3 shrink-0" />
              1 Blue Jays Way, Toronto, ON M5V 1J4
            </a>
            <div className="flex items-center gap-1.5 pt-0.5">
              <MLBLogo size={28} className="opacity-90" />
              <span className="text-blue-300 text-[10px]">Official MLB Licensed Retailer</span>
            </div>
          </div>

          {/* ── Col 2: Nav — two sub-columns ─────────────────── */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 min-w-0 w-full sm:w-auto">
            {/* Left nav column */}
            <nav className="flex flex-col -space-y-px min-w-0">
              {navItemsLeft.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 px-2 py-[5px] rounded-md text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150 group min-w-0">
                  <Icon className="w-4 h-4 text-blue-300/80 group-hover:text-white transition-colors shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
              <Link href="/support"
                className="flex items-center gap-2 px-2 py-[5px] rounded-md text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150 group min-w-0">
                <SupportIcon className="w-4 h-4 text-blue-300/80 group-hover:text-white transition-colors shrink-0" />
                <span className="truncate">Support</span>
              </Link>
              <Link href="/admin"
                className="hidden sm:flex items-center gap-2 px-2 py-[5px] rounded-md text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150 group min-w-0">
                <svg className="w-4 h-4 text-blue-300/80 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="truncate">{t.footer.staffLogin}</span>
              </Link>
            </nav>
            {/* Right nav column */}
            <nav className="flex flex-col -space-y-px min-w-0">
              {navItemsRight.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 px-2 py-[5px] rounded-md text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150 group min-w-0">
                  <Icon className="w-4 h-4 text-blue-300/80 group-hover:text-white transition-colors shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
              {/* Feedback lives in the floating edge tab on desktop; on mobile
                  (where the floating tab is hidden) it moves here so it's
                  reachable from the footer instead of overlapping content. */}
              <div className="sm:hidden">
                <FeedbackTab variant="footer" />
              </div>
            </nav>
          </div>

          {/* ── Col 3: Social + ALCS + Newsletter ────────────── */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            {/* Social */}
            <div className="flex flex-col items-center sm:items-end gap-1.5">
              <span className="text-blue-400 text-xs uppercase tracking-widest font-display font-semibold">Follow Us</span>
              <div className="flex items-center gap-2">
                <a href="https://www.instagram.com/bluejays" target="_blank" rel="noopener noreferrer"
                  className="group w-9 h-9 bg-white/10 hover:bg-gradient-to-tr hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" aria-label="Follow on Instagram">
                  <svg className="w-[18px] h-[18px] text-blue-200 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="https://x.com/bluejays" target="_blank" rel="noopener noreferrer"
                  className="group w-9 h-9 bg-white/10 hover:bg-black rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" aria-label="Follow on X">
                  <svg className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://www.mlbshop.ca/en/" target="_blank" rel="noopener noreferrer"
                  className="group w-9 h-9 bg-white/10 hover:bg-[#002D72] rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" aria-label="MLB Shop">
                  <svg className="w-[18px] h-[18px] text-blue-200 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </a>
                <a href="https://www.facebook.com/BlueJays" target="_blank" rel="noopener noreferrer"
                  className="group w-9 h-9 bg-white/10 hover:bg-[#1877F2] rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" aria-label="Follow on Facebook">
                  <svg className="w-[18px] h-[18px] text-blue-200 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://www.youtube.com/bluejays" target="_blank" rel="noopener noreferrer"
                  className="group w-9 h-9 bg-white/10 hover:bg-[#FF0000] rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110" aria-label="Watch on YouTube">
                  <svg className="w-[18px] h-[18px] text-blue-200 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Championship Badges */}
            <div className="flex flex-col items-center sm:items-end gap-2 w-full sm:w-auto">
              {/* Row 1: ALCS 2025 + World Series Champions */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full">
                {/* ALCS 2025 */}
                <div className="group inline-flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-[1.02]">
                  <Image src="/brand/alcs-2025-round.png" alt="2025 ALCS Champions" width={56} height={56}
                    className="w-10 h-10 rounded-full object-cover drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.12em] text-blue-300/70 font-medium leading-tight">American League</p>
                    <p className="text-[10px] font-display font-bold text-white uppercase tracking-wide leading-tight">Champions 2025</p>
                  </div>
                </div>
                {/* World Series Champions */}
                <div className="group inline-flex items-center gap-2 bg-gradient-to-r from-white/10 to-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-[1.02]">
                  <Image src="/brand/ws-champions.png" alt="World Series Champions 1992-1993" width={56} height={56}
                    className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.12em] text-blue-300/70 font-medium leading-tight">World Series</p>
                    <p className="text-[10px] font-display font-bold text-white uppercase tracking-wide leading-tight">Back-to-Back</p>
                  </div>
                </div>
              </div>
              {/* Row 2: WS 1992 & 1993 badges — matches row 1 width/alignment */}
              <div className="flex items-center gap-2 w-full">
                <div className="group flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/8 border border-white/15 px-2.5 py-1.5 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
                  <Image src="/brand/ws-1992.png" alt="1992 World Series" width={48} height={32}
                    className="w-11 h-8 object-contain drop-shadow-sm" />
                  <span className="text-[10px] font-display font-bold text-white uppercase tracking-wide">&apos;92</span>
                </div>
                <div className="group flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/8 border border-white/15 px-2.5 py-1.5 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
                  <Image src="/brand/ws-1993.png" alt="1993 World Series" width={48} height={32}
                    className="w-11 h-8 object-contain drop-shadow-sm" />
                  <span className="text-[10px] font-display font-bold text-white uppercase tracking-wide">&apos;93</span>
                </div>
              </div>
            </div>

            {/* Newsletter signup */}
            <div className="w-full max-w-[280px]">
              <p className="text-blue-300 text-xs text-center sm:text-right mb-1.5">Browse real-time stock &amp; reserve your gear</p>
              <Link href="/shop"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-full border-2 border-white/30 bg-white/5 hover:bg-white hover:text-jays-navy text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:border-white group">
                <svg className="w-4 h-4 text-blue-300 group-hover:text-jays-navy transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Shop &amp; Reserve Now
              </Link>
            </div>
          </div>
        </div>

        {/* ── Official Sponsors ───────────────────────────────── */}
        <div className="border-t border-blue-700/60 mt-4 pt-4 pb-3">
          <div className="flex items-center justify-center gap-2 mb-2.5">
            <span className="h-px w-6 bg-blue-700/50" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-blue-300/60">Official Sponsors</span>
            <span className="h-px w-6 bg-blue-700/50" />
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            {/* TD Logo */}
            <a href="https://www.td.com/ca" target="_blank" rel="noopener noreferrer"
              title="TD Bank Group — Official Sponsor"
              className="group flex items-center gap-2.5 rounded-full bg-white/5 border border-white/10 hover:border-[#00A800]/40 hover:bg-white/10 pl-1.5 pr-4 py-1.5 transition-all duration-300">
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#00A800]/30 shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/brand/td-bank.png"
                  alt="TD Bank"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <span className="text-xs font-semibold text-blue-100 group-hover:text-white transition-colors">TD Bank Group</span>
            </a>
            {/* Rogers Logo */}
            <a href="https://www.rogers.com" target="_blank" rel="noopener noreferrer"
              title="Rogers Communications — Official Sponsor"
              className="group flex items-center gap-2.5 rounded-full bg-white/5 border border-white/10 hover:border-[#E4022C]/40 hover:bg-white/10 pl-1.5 pr-4 py-1.5 transition-all duration-300">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white ring-2 ring-[#E4022C]/30 shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/brand/rogers-communications.png"
                  alt="Rogers"
                  fill
                  className="object-contain p-1.5"
                  sizes="40px"
                />
              </div>
              <span className="text-xs font-semibold text-blue-100 group-hover:text-white transition-colors">Rogers</span>
            </a>
          </div>
        </div>

        {/* ── Bottom Bar ─────────────────────────────────────── */}
        <div className="border-t border-blue-700/60 pt-3">
          <div className="flex flex-col items-center gap-2 mb-2">
            <p className="font-display text-lg sm:text-xl font-extrabold uppercase tracking-[0.2em] text-white/90">
              Let&apos;s Go <span className="text-jays-red">Jays!</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { src: '/brand/jays-bird.png', alt: 'Blue Jays Bird', size: 'w-6 h-6' },
                { src: '/brand/jays-classic.png', alt: 'Blue Jays Classic', size: 'w-7 h-7' },
                { src: '/brand/jays-maple.png', alt: 'Blue Jays Maple', size: 'w-7 h-7' },
                { src: '/brand/jays-retro-bat.png', alt: 'Blue Jays Retro', size: 'w-6 h-6' },
                { src: '/brand/jays-script.png', alt: 'Blue Jays Script', size: 'w-8 h-5' },
                { src: '/brand/logo.png', alt: 'Blue Jays', size: 'w-6 h-6' },
              ].map((logo, i) => (
                <div key={i} className="rounded-full bg-white/10 border border-white/15 p-1 hover:bg-white/20 hover:scale-110 transition-all duration-300">
                  <Image src={logo.src} alt={logo.alt} width={32} height={32} className={`${logo.size} object-contain`} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs font-semibold text-blue-300/80 uppercase tracking-wider">
              <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <span className="text-blue-700/60">|</span>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-blue-700/60">|</span>
              <Link href="/style-submission-policy" className="hover:text-white transition-colors">Style Submission Policy</Link>
            </div>
            <p className="text-center text-[10px] text-blue-400">
              &copy; {new Date().getFullYear()} Jays Shop. {t.footer.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
