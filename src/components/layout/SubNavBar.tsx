'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLayoutEffect, useRef, useState, useCallback } from 'react'
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
} from 'lucide-react'
import { useSearch } from '@/lib/store/SearchContext'

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
      {/* Main row: scrollable nav links + search */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-11 flex items-center gap-1 sm:gap-2">
        {/* Scrollable nav links — desktop/tablet only (sm+). On mobile, all
            links live in the Header's hamburger drawer instead, since this
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
