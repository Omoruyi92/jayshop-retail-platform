'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Shield,
  Users,
  Package,
  Shirt,
  Ruler,
  Compass,
} from 'lucide-react'

const links = [
  { href: '/',           label: 'Home',          icon: Home },
  { href: '/brands',     label: 'Brands',        icon: Shield },
  { href: '/players',    label: 'Shop by Player', icon: Users },
  { href: '/my-holds',   label: 'My Holds',      icon: Package },
  { href: '/shop',       label: 'Explore',       icon: Compass },
  { href: '/size-chart', label: 'Size Chart',    icon: Ruler },
]

export default function SubNavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-14 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-start gap-1 sm:gap-2 h-11 overflow-x-auto no-scrollbar">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-1.5 shrink-0 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition-all leading-none
                  ${active
                    ? 'bg-jays-navy text-white shadow-sm'
                    : 'text-jays-steel hover:text-jays-navy hover:bg-jays-ice/70'}
                `}
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
