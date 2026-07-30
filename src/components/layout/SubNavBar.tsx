'use client'
import Link from 'next/link'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { useLayoutEffect, useEffect, useRef, useState, useCallback } from 'react'
import {
  Home,
  Package,
  Users,
  ShoppingBag,
  Globe,
  Image as ImageIcon,
  Sparkles,
  PartyPopper,
  Gift,
  Search,
  X,
  Menu,
} from 'lucide-react'
import { useSearch } from '@/lib/store/SearchContext'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import PromotionAlert from '@/components/layout/PromotionAlert'
import { LocationBadge } from '@/components/ui/PartnerLogosBar'

const WE_CARE_VALUES = [
  { letter: 'W', word: 'Welcoming', desc: 'Every fan feels at home' },
  { letter: 'E', word: 'Empathy', desc: 'We understand your needs' },
  { letter: 'C', word: 'Caring', desc: 'Going the extra mile' },
  { letter: 'A', word: 'Authentic', desc: 'Genuine products & service' },
  { letter: 'R', word: 'Responsible', desc: 'Committed to doing right' },
  { letter: 'E', word: 'Experience', desc: 'Memorable every visit' },
]

// `mobileHidden` links are already reachable from the mobile bottom nav bar
// (BottomNav.tsx: Shop, My Holds) — hidden here on mobile only to avoid
// duplicate nav entries, while remaining visible on desktop (sm:flex).
// `external` links point off-site and render as plain <a> tags (new tab)
// instead of Next.js <Link> (client-side router navigation).
// `primary` links (Shop, Shop by Style, Shop by Player) are the main
// shopping entry points — styled bolder/navy with a subtle pill so they
// stand out from the rest of the nav (Home, Brands, Gallery, etc.).
export const links = [
  { href: '/',               label: 'Home',           icon: Home,       mobileHidden: false },
  { href: '/shop',           label: 'Shop',           icon: ShoppingBag, mobileHidden: true,  primary: true },
  { href: '/shop-by-style',  label: 'Shop by Style',  icon: Sparkles,   mobileHidden: false, primary: true },
  { href: '/players',        label: 'Shop by Player', icon: Users,      mobileHidden: false, primary: true },
  { href: '/brands',         label: 'Brands',         icon: Globe,      mobileHidden: false },
  { href: '/gallery',        label: 'Gallery',        icon: ImageIcon,  mobileHidden: false },
  { href: '/my-holds',       label: 'My Holds',       icon: Package,    mobileHidden: true },
  { href: 'https://www.mlb.com/bluejays/video', label: 'Fan Zone', icon: PartyPopper, mobileHidden: false, external: true },
  { href: 'https://www.mlb.com/bluejays/tickets/gift-card-centre', label: 'E-Gift Card', icon: Gift, mobileHidden: false, external: true },
]

export default function SubNavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileWeCareOpen, setMobileWeCareOpen] = useState(false)
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileNavPanelRef = useRef<HTMLDivElement>(null)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

  const { searchInput, setSearchInput, clearSearch } = useSearch()

  // Publish this bar's real rendered height so downstream sticky bars
  // (e.g. StickyShopCategoryNav on the Shop page) can stack directly
  // beneath it without being hidden behind it.
  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    const setVar = () => {
      document.documentElement.style.setProperty('--subnav-height', `${el.offsetHeight}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // When mobile search opens, focus the input
  useLayoutEffect(() => {
    if (mobileSearchOpen) {
      mobileInputRef.current?.focus()
    }
  }, [mobileSearchOpen])

  // Close the mobile nav drawer on route change (e.g. tapping a link).
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  // Full accessibility contract for the mobile nav drawer: traps Tab focus
  // inside the panel, closes on Escape, locks background scroll while open,
  // focuses the first link on open, and restores focus to the hamburger
  // trigger on close.
  useFocusTrap(mobileNavOpen, mobileNavPanelRef, closeMobileNav)

  const handleSearchChange = useCallback((v: string) => {
    setSearchInput(v)
  }, [setSearchInput])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (pathname !== '/shop') {
        router.push('/shop')
      }
      // blur so the keyboard hides on mobile
      ;(e.target as HTMLInputElement).blur()
      setMobileSearchOpen(false)
    }
    if (e.key === 'Escape') {
      clearSearch()
      setMobileSearchOpen(false)
    }
  }, [pathname, router, clearSearch])

  const handleMobileSearchToggle = useCallback(() => {
    if (mobileSearchOpen) {
      setMobileSearchOpen(false)
    } else {
      setMobileSearchOpen(true)
    }
  }, [mobileSearchOpen])

  const handleClear = useCallback(() => {
    clearSearch()
    setMobileSearchOpen(false)
  }, [clearSearch])

  return (
    <nav
      ref={navRef}
      style={{ top: 'var(--header-height, 3.5rem)' }}
      className="sticky z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm"
    >
      {/* Dismissible promotion alert — attached to the main nav bar.
          Renders null when no active promotion, so no reserved space.
          Living inside this <nav> means its height is captured by the
          --subnav-height ResizeObserver above, keeping downstream sticky
          bars (StickyShopCategoryNav) stacked correctly whether or not a
          promotion is showing. */}
      <PromotionAlert />

      {/* Main row: scrollable nav links + search */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-11 flex items-center gap-1 sm:gap-2">
        {/* Mobile nav hamburger — left-aligned trigger for the nav drawer.
            Hidden on desktop (sm+), where the scrollable pill row below is
            the nav mechanism instead. */}
        <button
          ref={mobileNavTriggerRef}
          type="button"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav-panel"
          className="sm:hidden flex items-center justify-center w-8 h-8 shrink-0 rounded-full text-jays-steel hover:text-jays-navy hover:bg-jays-ice/70 transition-colors"
        >
          {mobileNavOpen
            ? <X size={15} strokeWidth={2.2} />
            : <Menu size={15} strokeWidth={2.2} />
          }
        </button>

        {/* Mobile Time Status — the store status badge lives IN the main
            nav row on mobile (was previously its own strip under the
            header, see Header.tsx StoreStatusStrip). Centered between the
            hamburger and the search icon in a navy pill so the badge's
            dark-background styling (white/blue text, status dot) stays
            legible on this bar's white background. Replaces the plain
            flex-1 spacer that used to sit here. */}
        <div className="flex-1 sm:hidden flex justify-center min-w-0 px-1">
          <div className="bg-jays-navy rounded-full px-3 py-1 min-w-0 overflow-hidden">
            <LocationBadge compact />
          </div>
        </div>

        {/* Scrollable nav links — desktop/tablet only (sm+). On mobile, all
            links live in this bar's own hamburger drawer instead, since this
            row's overflow-x-auto scroll had no visual affordance and hid
            `Shop` (mobileHidden) entirely. */}
        <div className="hidden sm:block flex-1 overflow-x-auto no-scrollbar min-w-0">
          <div className="flex items-center justify-start gap-1 sm:gap-2 h-11 w-max">
            {links.map(({ href, label, icon: Icon, mobileHidden, external, primary }) => {
              const active = !external && pathname === href
              const className = `
                    ${mobileHidden ? 'hidden sm:flex' : 'flex'} items-center gap-1.5 shrink-0 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs uppercase tracking-wide transition-all leading-none
                    ${primary ? 'font-bold' : 'font-semibold'}
                    ${active
                      ? 'bg-jays-navy text-white shadow-sm'
                      : primary
                        ? 'text-jays-navy bg-jays-ice hover:bg-jays-ice'
                        : 'text-jays-steel hover:text-jays-navy hover:bg-jays-ice/70'}
                  `
              if (external) {
                return (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (opens in a new tab)`}
                    className={className}
                  >
                    <Icon size={13} strokeWidth={2.2} />
                    <span className="whitespace-nowrap">{label}</span>
                  </a>
                )
              }
              return (
                <Link
                  key={href}
                  href={href}
                  className={className}
                >
                  <Icon size={13} strokeWidth={2.2} />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Separator — desktop only */}
        <span className="hidden sm:block w-px h-5 bg-gray-200 shrink-0" aria-hidden="true" />

        {/* Desktop search input — hidden on mobile */}
        <div className="hidden sm:flex items-center shrink-0 relative">
          <label htmlFor="subnav-search" className="sr-only">Search products</label>
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-jays-steel/60" aria-hidden="true">
            <Search size={13} strokeWidth={2.2} />
          </span>
          <input
            ref={desktopInputRef}
            id="subnav-search"
            type="search"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            autoComplete="off"
            spellCheck={false}
            className="w-40 focus:w-56 transition-[width] duration-200 ease-in-out rounded-full bg-gray-100 border border-gray-200 py-1.5 pl-7 pr-7 text-xs text-jays-navy placeholder:text-jays-steel/60 focus:border-jays-navy/40 focus:ring-1 focus:ring-jays-navy/20 focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-jays-steel/60 hover:text-jays-navy transition-colors"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Mobile search icon — hidden on desktop */}
        <button
          type="button"
          aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
          onClick={handleMobileSearchToggle}
          className="sm:hidden flex items-center justify-center w-8 h-8 shrink-0 rounded-full text-jays-steel hover:text-jays-navy hover:bg-jays-ice/70 transition-colors"
        >
          {mobileSearchOpen
            ? <X size={15} strokeWidth={2.2} />
            : <Search size={15} strokeWidth={2.2} />
          }
        </button>
      </div>

      {/* Mobile search expansion row */}
      {mobileSearchOpen && (
        <div className="sm:hidden border-t border-gray-100 px-3 py-2">
          <div className="relative">
            <label htmlFor="subnav-search-mobile" className="sr-only">Search products</label>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-jays-steel/60" aria-hidden="true">
              <Search size={14} strokeWidth={2.2} />
            </span>
            <input
              ref={mobileInputRef}
              id="subnav-search-mobile"
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products..."
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-full bg-gray-100 border border-gray-200 py-2 pl-8 pr-8 text-sm text-jays-navy placeholder:text-jays-steel/60 focus:border-jays-navy/40 focus:ring-1 focus:ring-jays-navy/20 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-jays-steel/60 hover:text-jays-navy transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile nav drawer — portaled to document.body (see below) rather
          than rendered inline here. This `<nav>` has `backdrop-blur` on
          itself (see className above), and `backdrop-filter` on an
          ancestor establishes a containing block for `position: fixed`
          descendants (same as `transform`/`filter`/`perspective`/
          `will-change`/`contain: paint`) — a `fixed` child would anchor to
          this nav's box instead of the viewport and lose full-height
          coverage. `createPortal(..., document.body)` sidesteps that
          entirely, matching the repo-wide convention for every other fixed
          overlay (Dialog.tsx, Dropdown.tsx, HeaderActions.tsx,
          NotificationBell.tsx, StickyShopCategoryNav.tsx,
          HowOthersAreWearingIt.tsx all portal to document.body for the
          same reason). */}
      {mobileNavOpen && createPortal(
        <>
          {/* Backdrop — dims and covers the rest of the screen (including
              BottomNav), click to close. */}
          <div
            className="sm:hidden fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200"
            aria-hidden="true"
            onClick={closeMobileNav}
          />
          {/* Slides from the LEFT to match the hamburger trigger's
              left-aligned position above. w-[72vw] max-w-[288px] is
              deliberately not full-bleed, leaving a strip of tappable
              backdrop on the right — narrower than the original
              w-[85vw] max-w-sm, which read too wide on a 390px iPhone
              (~331px). min-w-[260px] is a hard floor: the We Care
              accordion rows carry a title + description line (e.g.
              "Welcoming / Every fan feels at home") that wraps badly
              below ~260px. On a 320px iPhone SE, 72vw alone would be
              ~230px (under the floor), so min-w clamps it back up to
              260px there; on 390-414px phones, 72vw lands at 281-298px,
              capped at 288px by max-w so it never grows past that even
              on wider phones. All 9 links plus the We Care accordion
              fit without scrolling on common phone viewports;
              overflow-y-auto remains only as a fallback for very short/
              landscape viewports, not the primary layout. pb-safe
              (globals.css) matches BottomNav's own safe-area convention so
              the last row clears the home indicator.
              z-50 on both the backdrop and the panel matches Dialog.tsx's
              existing overlay convention (fixed inset-0 bg-black/50 +
              z-50) and intentionally outranks BottomNav's z-40
              (BottomNav.tsx) and this bar's own z-30, so the drawer and
              its scrim fully occlude the bottom tab bar rather than
              partially overlapping it while open. */}
          <div
            id="mobile-nav-panel"
            ref={mobileNavPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            tabIndex={-1}
            className="sm:hidden fixed inset-y-0 left-0 z-50 h-full w-[72vw] max-w-[288px] min-w-[260px] overflow-y-auto bg-white shadow-2xl py-2 pb-safe animate-in slide-in-from-left duration-200 focus:outline-none"
          >
            {/* Logo block — branding anchor at the top of the drawer, above
                the link list. Same `/brand/logo.png` asset Header.tsx uses
                top-left, so the drawer and header stay visually consistent.
                px-5 matches the link rows' horizontal padding below so the
                logo's left edge lines up with the link icons. Tapping it
                navigates home; route-change already closes the drawer via
                the `pathname` effect above, but a tap while already on `/`
                doesn't change pathname, so onClick closes explicitly for
                that same-route case. */}
            <Link
              href="/"
              onClick={closeMobileNav}
              aria-label="Jays Shop home"
              className="flex items-center px-5 py-3"
            >
              <Image
                src="/brand/logo.png"
                alt="Blue Jays logo"
                width={44}
                height={44}
                priority={false}
                className="w-11 h-11 object-contain"
              />
            </Link>

            <div className="border-t border-gray-100" aria-hidden="true" />

            {/* Nav links — same source of truth as the pill row above */}
            <div className="py-1">
              {links.map(({ href, label, icon: Icon, external }) => {
                const active = !external && pathname === href
                const className = `flex items-center gap-3 px-5 py-3.5 text-base transition-colors ${
                  active ? 'text-jays-navy font-semibold bg-jays-ice' : 'text-gray-700 hover:bg-jays-ice'
                }`
                if (external) {
                  return (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${label} (opens in a new tab)`}
                      className={className}
                    >
                      <Icon size={18} strokeWidth={2} className="shrink-0" />
                      {label}
                    </a>
                  )
                }
                return (
                  <Link key={href} href={href} className={className}>
                    <Icon size={18} strokeWidth={2} className="shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>

            <div className="my-1 border-t border-gray-100" aria-hidden="true" />

            {/* We Care — expandable */}
            <button
              onClick={() => setMobileWeCareOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-base text-gray-700 hover:bg-jays-ice transition-colors"
              aria-expanded={mobileWeCareOpen}
            >
              <span className="flex items-center gap-3">
                <svg className="w-[18px] h-[18px] text-jays-navy shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                We Care
              </span>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${mobileWeCareOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mobileWeCareOpen && (
              <div className="px-5 pb-3 pt-1 bg-jays-ice/50">
                {WE_CARE_VALUES.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className="w-7 h-7 bg-gradient-to-br from-jays-red to-red-600 text-white rounded-md flex items-center justify-center font-display font-bold text-xs shrink-0">
                      {v.letter}
                    </span>
                    <div>
                      <p className="font-display font-semibold text-sm text-jays-navy leading-tight">{v.word}</p>
                      <p className="text-xs text-jays-steel leading-tight">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  )
}
