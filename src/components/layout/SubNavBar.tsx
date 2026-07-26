'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef } from 'react'
import {
  Home,
  Package,
  Users,
  ShoppingBag,
  Globe,
  Image as ImageIcon,
  Sparkles,
  PartyPopper,
} from 'lucide-react'

// `mobileHidden` links are already reachable from the mobile bottom nav bar
// (BottomNav.tsx: Shop, My Holds) — hidden here on mobile only to avoid
// duplicate nav entries, while remaining visible on desktop (sm:flex).
// `external` links point off-site and render as plain <a> tags (new tab)
// instead of Next.js <Link> (client-side router navigation).
const links = [
  { href: '/',               label: 'Home',           icon: Home,       mobileHidden: false },
  { href: '/shop',           label: 'Shop',           icon: ShoppingBag, mobileHidden: true },
  { href: '/shop-by-style',  label: 'Shop by Style',  icon: Sparkles,   mobileHidden: false },
  { href: '/players',        label: 'Shop by Player', icon: Users,      mobileHidden: false },
  { href: '/brands',         label: 'Brands',         icon: Globe,      mobileHidden: false },
  { href: '/gallery',        label: 'Gallery',        icon: ImageIcon,  mobileHidden: false },
  { href: '/my-holds',       label: 'My Holds',       icon: Package,    mobileHidden: true },
  { href: 'https://www.mlb.com/bluejays/video', label: 'Fan Zone', icon: PartyPopper, mobileHidden: false, external: true },
]

export default function SubNavBar() {
  const pathname = usePathname()
  const navRef = useRef<HTMLElement>(null)

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

  return (
    <nav
      ref={navRef}
      style={{ top: 'var(--header-height, 3.5rem)' }}
      className="sticky z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-start gap-1 sm:gap-2 h-11 w-max mx-auto">
          {links.map(({ href, label, icon: Icon, mobileHidden, external }) => {
            const active = !external && pathname === href
            const className = `
                  ${mobileHidden ? 'hidden sm:flex' : 'flex'} items-center gap-1.5 shrink-0 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition-all leading-none
                  ${active
                    ? 'bg-jays-navy text-white shadow-sm'
                    : 'text-jays-steel hover:text-jays-navy hover:bg-jays-ice/70'}
                `
            if (external) {
              return (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
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
