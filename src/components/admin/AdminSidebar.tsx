'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Package, ClipboardList, History,
  BarChart2, Bell, LogOut, ExternalLink, Menu, X,
  Tag, Image as ImageIcon, Users, Megaphone, Calendar,
  Clock, Boxes, KeyRound, Radio, Terminal, LineChart,
  ScrollText, Star, MessageSquare, UserCog, Settings, FolderTree,
} from 'lucide-react'

const linkGroups = [
  {
    label: 'Overview',
    links: [
      { href: '/admin',               label: 'Dashboard',     icon: LayoutDashboard },
    ],
  },
  {
    label: 'Catalog',
    links: [
      { href: '/admin/products',      label: 'Products',      icon: Package },
      { href: '/admin/categories',    label: 'Categories',    icon: FolderTree },
      { href: '/admin/brands',        label: 'Brands',        icon: Tag },
      { href: '/admin/gallery',       label: 'Gallery',       icon: ImageIcon },
      { href: '/admin/players',       label: 'Players',       icon: Users },
      { href: '/admin/promotions',    label: 'Promotions',    icon: Megaphone },
    ],
  },
  {
    label: 'Operations',
    links: [
      { href: '/admin/holds',              label: 'Holds',            icon: ClipboardList },
      { href: '/admin/hold-settings',       label: 'Hold Settings',    icon: Clock },
      { href: '/admin/inventory/history',   label: 'Inventory History',icon: Boxes },
      { href: '/admin/game-days',           label: 'Game Days',        icon: Calendar },
    ],
  },
  {
    label: 'POS',
    links: [
      { href: '/admin/pos-keys',       label: 'POS Keys',      icon: KeyRound },
      { href: '/admin/pos-events',     label: 'POS Events',    icon: Radio },
      { href: '/admin/pos-simulator',  label: 'POS Simulator', icon: Terminal },
    ],
  },
  {
    label: 'Insights',
    links: [
      { href: '/admin/analytics',     label: 'Analytics',     icon: LineChart },
      { href: '/admin/reports',       label: 'Reports',       icon: BarChart2 },
      { href: '/admin/history',       label: 'History',       icon: History },
      { href: '/admin/audit-log',     label: 'Audit Log',     icon: ScrollText },
    ],
  },
  {
    label: 'Community',
    links: [
      { href: '/admin/reviews',       label: 'Reviews',       icon: Star },
      { href: '/admin/feedback',      label: 'Feedback',      icon: MessageSquare },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Admin',
    links: [
      { href: '/admin/admins',        label: 'Admins',        icon: UserCog },
      { href: '/admin/settings',      label: 'Settings',      icon: Settings },
    ],
  },
]

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-blue-700">
        <p className="font-display font-bold text-lg uppercase tracking-wider">
          <span className="text-jays-red">Jays</span> Shop
        </p>
        <p className="text-blue-300 text-xs mt-0.5">Staff Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {linkGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-blue-300/60">
              {group.label}
            </p>
            {group.links.map(({ href, label, icon: Icon }) => {
              const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Sign out + public site */}
      <div className="px-3 pb-4 space-y-1">
        <Link
          href="/"
          onClick={onLinkClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink size={16} />
          View Shop
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-blue-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  )
}

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-jays-royal text-white shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-jays-royal text-white h-14 flex items-center px-4 gap-3 shadow-md">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <p className="font-display font-bold text-base uppercase tracking-wider">
          <span className="text-jays-red">Jays</span> Shop
        </p>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-jays-royal text-white flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        <SidebarContent onLinkClick={() => setMobileOpen(false)} />
      </aside>
    </>
  )
}
