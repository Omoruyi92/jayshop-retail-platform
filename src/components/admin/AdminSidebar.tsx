'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { AdminRole } from '@prisma/client'
import {
  LayoutDashboard, Package, ClipboardList, History,
  BarChart2, Bell, ExternalLink, Menu, X,
  Tag, Image as ImageIcon, Users, Megaphone, Calendar,
  Clock, Boxes, KeyRound, Radio, Terminal, LineChart,
  ScrollText, Star, MessageSquare, UserCog, Settings, FolderTree, Camera,
} from 'lucide-react'

const roleOrder: AdminRole[] = ['VIEWER', 'STAFF', 'MANAGER', 'OWNER']

function rank(role?: AdminRole | string | null): number {
  if (!role) return -1
  return roleOrder.indexOf(role as AdminRole)
}

type LinkItem = {
  href: string
  label: string
  icon: React.ElementType
  minRole: AdminRole
}

type LinkGroup = {
  label: string
  links: LinkItem[]
}

const linkGroups: LinkGroup[] = [
  {
    label: 'Overview',
    links: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, minRole: 'VIEWER' },
    ],
  },
  {
    label: 'Catalog',
    links: [
      { href: '/admin/products', label: 'Products', icon: Package, minRole: 'VIEWER' },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree, minRole: 'MANAGER' },
      { href: '/admin/brands', label: 'Brands', icon: Tag, minRole: 'MANAGER' },
      { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon, minRole: 'MANAGER' },
      { href: '/admin/players', label: 'Players', icon: Users, minRole: 'MANAGER' },
      { href: '/admin/promotions', label: 'Promotions', icon: Megaphone, minRole: 'MANAGER' },
    ],
  },
  {
    label: 'Operations',
    links: [
      { href: '/admin/holds', label: 'Holds', icon: ClipboardList, minRole: 'STAFF' },
      { href: '/admin/hold-settings', label: 'Hold Settings', icon: Clock, minRole: 'MANAGER' },
      { href: '/admin/inventory/history', label: 'Inventory History', icon: Boxes, minRole: 'STAFF' },
      { href: '/admin/game-days', label: 'Game Days', icon: Calendar, minRole: 'MANAGER' },
    ],
  },
  {
    label: 'POS',
    links: [
      { href: '/admin/pos-keys', label: 'POS Keys', icon: KeyRound, minRole: 'OWNER' },
      { href: '/admin/pos-events', label: 'POS Events', icon: Radio, minRole: 'STAFF' },
      { href: '/admin/pos-simulator', label: 'POS Simulator', icon: Terminal, minRole: 'OWNER' },
    ],
  },
  {
    label: 'Insights',
    links: [
      { href: '/admin/analytics', label: 'Analytics', icon: LineChart, minRole: 'VIEWER' },
      { href: '/admin/reports', label: 'Reports', icon: BarChart2, minRole: 'VIEWER' },
      { href: '/admin/history', label: 'History', icon: History, minRole: 'VIEWER' },
      { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText, minRole: 'OWNER' },
    ],
  },
  {
    label: 'Community',
    links: [
      { href: '/admin/reviews', label: 'Reviews', icon: Star, minRole: 'VIEWER' },
      { href: '/admin/customer-photos', label: 'Customer Photos', icon: Camera, minRole: 'STAFF' },
      { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare, minRole: 'VIEWER' },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell, minRole: 'VIEWER' },
    ],
  },
  {
    label: 'Admin',
    links: [
      { href: '/admin/admins', label: 'Admins', icon: UserCog, minRole: 'OWNER' },
      { href: '/admin/settings', label: 'Settings', icon: Settings, minRole: 'OWNER' },
    ],
  },
]

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role as AdminRole | undefined
  const userRank = rank(userRole)

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
        {linkGroups.map((group) => {
          const visibleLinks = group.links.filter((link) => userRank >= rank(link.minRole))
          if (visibleLinks.length === 0) return null
          return (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-blue-300/60">
                {group.label}
              </p>
              {visibleLinks.map(({ href, label, icon: Icon }) => {
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
          )
        })}
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
