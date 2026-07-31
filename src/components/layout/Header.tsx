'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Locale } from '@/lib/i18n/translations'
import MLBLogo from '@/components/ui/MLBLogo'
import PartnerLogosBar from '@/components/ui/PartnerLogosBar'
import HeaderActions from '@/components/layout/HeaderActions'
import { useDropdownPosition } from '@/hooks/useDropdownPosition'

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
}

const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  es: 'ES',
}

const LOCALES: Locale[] = ['en', 'fr', 'es']

const WE_CARE_VALUES = [
  { letter: 'W', word: 'Welcoming', desc: 'Every fan feels at home' },
  { letter: 'E', word: 'Empathy', desc: 'We understand your needs' },
  { letter: 'C', word: 'Caring', desc: 'Going the extra mile' },
  { letter: 'A', word: 'Authentic', desc: 'Genuine products & service' },
  { letter: 'R', word: 'Responsible', desc: 'Committed to doing right' },
  { letter: 'E', word: 'Experience', desc: 'Memorable every visit' },
]


export default function Header() {
  const { t, locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [weCareOpen, setWeCareOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const langTriggerRef = useRef<HTMLButtonElement>(null)
  const langPanelRef = useRef<HTMLDivElement>(null)
  const weCareRef = useRef<HTMLDivElement>(null)
  const weCareTriggerRef = useRef<HTMLButtonElement>(null)
  const weCarePanelRef = useRef<HTMLDivElement>(null)

  const headerRef = useRef<HTMLElement>(null)

  // Publish the header's real rendered height as a CSS var so downstream
  // sticky bars (SubNavBar, StickyShopCategoryNav) can stack under it without
  // overlap, regardless of breakpoint (the header grows taller below xl due
  // to the secondary partner-logo strip).
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const setVar = () => {
      document.documentElement.style.setProperty('--header-height', `${el.offsetHeight}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
      if (weCareRef.current && !weCareRef.current.contains(e.target as Node)) {
        setWeCareOpen(false)
      }
    }
    if (open || weCareOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, weCareOpen])

  // Anchors the language options panel to the trigger's real on-screen
  // position (fixed + viewport-clamped), matching the cart/favorites
  // dropdown fix — `absolute right-0` clips off-screen on mobile because
  // the trigger itself sits close to the viewport's right edge.
  const langPanelStyle = useDropdownPosition(open, langTriggerRef, langPanelRef)

  // Same fix for the "We Care" values popover (desktop/tablet) — anchors
  // to the trigger's real position instead of `absolute right-0` on its
  // own narrow wrapper.
  const weCarePanelStyle = useDropdownPosition(weCareOpen, weCareTriggerRef, weCarePanelRef)

  return (
    <header ref={headerRef} className="bg-jays-navy text-white sticky top-0 z-40 shadow-md overflow-x-clip">
      {/* Main nav row */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 flex items-center gap-2">
        {/* Left: Logo + MLB */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-2 focus-visible:outline-none" aria-label="Jays Shop home">
            <Image
              src="/brand/logo.png"
              alt="Blue Jays logo"
              width={44}
              height={44}
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
              priority
            />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="font-display font-bold text-xl uppercase tracking-wider leading-none text-center">
                <span className="text-jays-red">JAYS</span>
                <span className="text-white"> SHOP</span>
              </span>
              <span className="block text-center text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-[0.22em] sm:tracking-[0.15em] text-blue-200/80 mt-0.5 whitespace-nowrap">
                Toronto Blue Jays
              </span>
            </span>
          </Link>
          <span className="hidden sm:block w-px h-5 bg-white/20 mx-0.5" aria-hidden="true" />
          <MLBLogo size={44} className="hidden sm:block opacity-80 shrink-0" />
        </div>

        {/* Center: Partner logos banner — only on xl+ to avoid overflow */}
        <div className="hidden xl:block flex-1 mx-2 min-w-0 overflow-hidden">
          <PartnerLogosBar />
        </div>

        {/* Spacer on non-xl screens — store status lives in StoreStatusStrip below */}
        <div className="flex-1 xl:hidden" />

        {/* Right: We Care, Language, Nav */}
        <div className="flex items-center gap-0 xs:gap-0.5 sm:gap-2 shrink-0">
          <HeaderActions />

          {/* "We Care" — clickable with popover. Shown from `sm` (640px)
              up, exactly where the mobile hamburger (below) hides, so
              there's no dead zone between the two breakpoints where
              neither control is reachable. */}
          <div className="relative hidden sm:block" ref={weCareRef}>
            <button
              ref={weCareTriggerRef}
              onClick={() => setWeCareOpen((prev) => !prev)}
              className="text-blue-200 italic text-sm tracking-wide hover:text-white hover:scale-105 transition-all duration-200 cursor-pointer whitespace-nowrap"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              aria-label="We Care values"
              aria-haspopup="true"
              aria-expanded={weCareOpen}
            >
              <span className="inline-block animate-breathe">We Care</span>
            </button>

            {weCareOpen && (
              <div
                ref={weCarePanelRef}
                style={weCarePanelStyle}
                className="fixed w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-jays-navy to-jays-royal px-4 py-3">
                  <p className="font-display font-bold text-sm uppercase tracking-wider text-white">
                    Our Values
                  </p>
                  <p className="text-blue-200 text-[10px] mt-0.5">What WE CARE means to us</p>
                </div>
                {/* Values list */}
                <div className="p-2">
                  {WE_CARE_VALUES.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-jays-ice transition-colors duration-150"
                    >
                      <span className="w-8 h-8 bg-gradient-to-br from-jays-red to-red-600 text-white rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 shadow-sm">
                        {v.letter}
                      </span>
                      <div>
                        <p className="font-display font-semibold text-sm text-jays-navy">{v.word}</p>
                        <p className="text-[10px] text-jays-steel leading-tight">{v.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              ref={langTriggerRef}
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-0.5 xs:gap-1 bg-white/10 backdrop-blur text-white rounded-lg px-0 xs:px-1 sm:px-2.5 py-1.5 text-[11px] xs:text-xs font-medium transition-colors duration-150 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 whitespace-nowrap"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label="Select language"
            >
              <span className="sm:hidden">{LOCALE_SHORT_LABELS[locale]}</span>
              <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
              <svg
                className={`hidden min-[340px]:block w-2.5 h-2.5 xs:w-3 xs:h-3 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
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
                ref={langPanelRef}
                role="listbox"
                aria-label="Language"
                style={langPanelStyle}
                className="fixed w-36 bg-white shadow-lg rounded-lg border border-gray-100 py-1 z-50"
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

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-4 text-sm font-medium whitespace-nowrap">
            <Image
              src="/brand/canada-flag.png"
              alt="Canada"
              width={32}
              height={32}
              className="hidden lg:block w-7 h-7 rounded-full object-contain drop-shadow-md"
            />
          </nav>

          {/* Landscape mobile flag — visible when a phone is rotated,
              where the drawer logo area may scroll out of view. */}
          <Image
            src="/brand/canada-flag.png"
            alt="Canada"
            width={28}
            height={28}
            className="hidden [@media(orientation:landscape)_and_(max-height:500px)_and_(max-width:1023px)]:block w-6 h-6 rounded-full object-contain drop-shadow-md shrink-0"
          />

        </div>
      </div>

    </header>
  )
}
