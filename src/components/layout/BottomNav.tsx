'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Bookmark, MessageCircle } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navItems = [
    { href: '/shop',     label: t.bottomNav.shop,     icon: ShoppingBag },
    { href: '/my-holds', label: t.bottomNav.myHolds,  icon: Bookmark },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border z-40 pb-safe">
      <div className="flex">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-3 min-h-[56px] transition-colors duration-150 ${
                active ? 'text-jays-navy' : 'text-jays-steel hover:text-jays-navy'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-jays-navy mt-0.5" />}
            </Link>
          )
        })}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
          className="flex-1 flex flex-col items-center py-3 min-h-[56px] text-jays-steel hover:text-jays-navy transition-colors duration-150"
        >
          <MessageCircle size={20} strokeWidth={1.5} />
          <span className="text-xs mt-1 font-medium">{t.bottomNav.chat}</span>
        </button>
      </div>
    </nav>
  )
}
