'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Locale } from '@/lib/i18n/translations'
import MLBLogo from '@/components/ui/MLBLogo'

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
}

const LOCALES: Locale[] = ['en', 'fr', 'es']

export default function Header() {
  const { t, locale, setLocale } = useLanguage()
  const { status } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { href: '/shop',     label: t.header.shop },
    { href: '/my-holds', label: t.header.myHolds },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <header className="bg-jays-navy text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/" className="flex items-center gap-3 focus-visible:outline-none" aria-label="Jays Shop home">
            <Image
              src="/brand/logo.png"
              alt="Blue Jays logo"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-contain"
              priority
            />
            <span className="font-display font-bold text-xl uppercase tracking-wider leading-none">
              <span className="text-jays-red">JAYS</span>
              <span className="text-white"> SHOP</span>
            </span>
          </Link>
          <span className="hidden sm:block w-px h-5 bg-white/20 mx-1" aria-hidden="true" />
          <MLBLogo size={44} className="hidden sm:block opacity-80" />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Unified language selector dropdown */}
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

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
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
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors duration-150 text-xs"
            >
              {t.header.staff}
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
