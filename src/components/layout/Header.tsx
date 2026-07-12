'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Locale } from '@/lib/i18n/translations'
import MLBLogo from '@/components/ui/MLBLogo'
import PartnerLogosBar from '@/components/ui/PartnerLogosBar'
import HeaderActions from '@/components/layout/HeaderActions'

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
}

const LOCALES: Locale[] = ['en', 'fr', 'es']

const WE_CARE_VALUES = [
  { letter: 'W', word: 'Welcoming', desc: 'Every fan feels at home' },
  { letter: 'E', word: 'Empathy', desc: 'We understand your needs' },
  { letter: 'C', word: 'Caring', desc: 'Going the extra mile' },
  { letter: 'A', word: 'Authentic', desc: 'Genuine products & service' },
  { letter: 'R', word: 'Responsible', desc: 'Committed to doing right' },
  { letter: 'E', word: 'Experience', desc: 'Memorable every visit' },
] as const

const MOBILE_PARTNERS = [
  { src: '/brand/partners/nike.png', alt: 'Nike', landscape: true },
  { src: '/brand/partners/new-era.png', alt: 'New Era', landscape: false },
  { src: '/brand/partners/fanatics.png', alt: 'Fanatics', landscape: true },
  { src: '/brand/partners/levelwear.png', alt: 'Levelwear', landscape: false },
  { src: '/brand/partners/47brand.jpg', alt: '47 Brand', landscape: false },
  { src: '/brand/partners/roots.jpg', alt: 'Roots', landscape: true },
  { src: '/brand/partners/peace-collective.png', alt: 'Peace Collective', landscape: false },
  { src: '/brand/partners/mitchell-ness.png', alt: 'Mitchell & Ness', landscape: true },
  { src: '/brand/partners/bulletin.png', alt: 'Bulletin', landscape: false },
] as const

export default function Header() {
  const { t, locale, setLocale } = useLanguage()
  const { status } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [weCareOpen, setWeCareOpen] = useState(false)
  const [shopDropOpen, setShopDropOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileWeCareOpen, setMobileWeCareOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const weCareRef = useRef<HTMLDivElement>(null)
  const shopDropRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { href: '/players', label: t.header.popularPlayers },
    { href: '/about-us', label: t.header.about },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) setOpen(false)
      if (weCareRef.current && !weCareRef.current.contains(target)) setWeCareOpen(false)
      if (shopDropRef.current && !shopDropRef.current.contains(target)) setShopDropOpen(false)
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) setMobileMenuOpen(false)
    }

    if (open || weCareOpen || shopDropOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, weCareOpen, shopDropOpen, mobileMenuOpen])

  return (
    <header className="sticky top-0 z-40 overflow-x-clip bg-jays-navy text-white shadow-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-2 sm:px-4">
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-2 focus-visible:outline-none" aria-label="Jays Shop home">
            <Image
              src="/brand/logo.png"
              alt="Blue Jays logo"
              width={44}
              height={44}
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
              priority
            />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold uppercase tracking-wider leading-none">
                <span className="text-jays-red">JAYS</span>
                <span className="text-white"> SHOP</span>
              </span>
              <span className="mt-0.5 block whitespace-nowrap text-[7px] font-semibold uppercase tracking-[0.1em] text-blue-200/80 sm:text-[9px] sm:tracking-[0.15em]">
                Toronto Blue Jays
              </span>
            </span>
          </Link>
          <span className="mx-0.5 hidden h-5 w-px bg-white/20 sm:block" aria-hidden="true" />
          <MLBLogo size={44} className="hidden shrink-0 opacity-80 sm:block" />
        </div>

        <div className="mx-2 hidden min-w-0 flex-1 overflow-hidden xl:block">
          <PartnerLogosBar />
        </div>

        <div className="flex-1 xl:hidden" />

        <div className="flex items-center gap-1 shrink-0 sm:gap-2">
          <HeaderActions />

          <div className="relative hidden md:block" ref={weCareRef}>
            <button
              onClick={() => setWeCareOpen((prev) => !prev)}
              className="cursor-pointer whitespace-nowrap text-sm tracking-wide text-blue-200 transition-all duration-200 hover:scale-105 hover:text-white"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}
              aria-label="We Care values"
            >
              <span className="inline-block animate-breathe">We Care</span>
            </button>

            {weCareOpen && (
              <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl duration-200">
                <div className="bg-gradient-to-r from-jays-navy to-jays-royal px-4 py-3">
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-white">Our Values</p>
                  <p className="mt-0.5 text-[10px] text-blue-200">What WE CARE means to us</p>
                </div>
                <div className="p-2">
                  {WE_CARE_VALUES.map((value) => (
                    <div
                      key={value.word}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-150 hover:bg-jays-ice"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-jays-red to-red-600 text-sm font-bold text-white shadow-sm">
                        {value.letter}
                      </span>
                      <div>
                        <p className="font-display text-sm font-semibold text-jays-navy">{value.word}</p>
                        <p className="text-xs text-jays-steel">{value.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label="Select language"
            >
              <span>{LOCALE_LABELS[locale]}</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div
                role="listbox"
                aria-label="Language"
                className="absolute right-0 mt-1.5 w-36 bg-white shadow-lg rounded-lg border border-gray-100 py-1 z-50"
              >
                {LOCALES.map((loc) => (
                  <button
                    key={loc}
                    role="option"
                    aria-selected={locale === loc}
                    onClick={() => { setLocale(loc); setOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors duration-100 ${
                      locale === loc
                        ? 'bg-jays-navy text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {LOCALE_LABELS[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav className="hidden items-center gap-4 whitespace-nowrap text-sm font-medium sm:flex">
            <div className="relative" ref={shopDropRef}>
              <button
                onClick={() => setShopDropOpen((prev) => !prev)}
                className="relative flex items-center gap-1 pb-0.5 transition-colors duration-150 hover:text-blue-200"
              >
                {t.header.shop}
                <svg
                  className={`h-3 w-3 transition-transform duration-150 ${shopDropOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {shopDropOpen && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                  <Link href="/shop" onClick={() => setShopDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-jays-ice">
                    <span>Browse Shop</span>
                  </Link>
                  <Link href="/brands" onClick={() => setShopDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-jays-ice">
                    <span>Brands</span>
                  </Link>
                  <Link href="/my-holds" onClick={() => setShopDropOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-jays-ice">
                    <span>{t.header.myHolds}</span>
                  </Link>
                </div>
              )}
            </div>

            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative pb-0.5 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-200 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 hover:text-blue-200 transition-colors duration-150"
              >
                {label}
              </Link>
            ))}

            <button
              onClick={() => router.push(status === 'authenticated' ? '/admin' : '/admin/login')}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-white/20"
            >
              {t.header.staff}
            </button>
          </nav>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-white/10 sm:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 bg-jays-navy/95 px-3 py-2 xl:hidden">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <span className="shrink-0 text-[9px] uppercase tracking-[0.2em] text-blue-200/60">Partners</span>
          {MOBILE_PARTNERS.map((partner) => (
            <div key={partner.alt} className="shrink-0 rounded-md px-1 py-0.5 opacity-70">
              <Image
                src={partner.src}
                alt={partner.alt}
                width={partner.landscape ? 48 : 20}
                height={20}
                className="h-4 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="space-y-4 border-t border-white/10 bg-jays-navy px-4 py-4 shadow-2xl sm:hidden">
          <div>
            <button
              onClick={() => setMobileWeCareOpen((prev) => !prev)}
              className="flex w-full items-center justify-between text-left text-blue-200"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: 'italic' }}
            >
              <span>We Care</span>
              <span>{mobileWeCareOpen ? '−' : '+'}</span>
            </button>
            {mobileWeCareOpen && (
              <div className="mt-3 space-y-2">
                {WE_CARE_VALUES.map((value) => (
                  <div key={value.word} className="rounded-xl bg-white/5 px-3 py-2">
                    <p className="text-sm font-semibold text-white">{value.word}</p>
                    <p className="text-xs text-blue-100/70">{value.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white">Browse Shop</Link>
            <Link href="/players" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white">{t.header.popularPlayers}</Link>
            <Link href="/about-us" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white">{t.header.about}</Link>
            <Link href="/my-holds" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white">{t.header.myHolds}</Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                router.push(status === 'authenticated' ? '/admin' : '/admin/login')
              }}
              className="block text-sm text-white"
            >
              {t.header.staff}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
