'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { SUBS_BY_CAT } from '@/lib/constants'

const CATEGORY_LABELS: Record<string, string> = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  accessories: 'Accessories',
  authentication: 'Authentication',
  sports: 'Sports',
}

const CATEGORY_SORT_ORDER = ['men', 'women', 'kids', 'accessories', 'sports', 'authentication']

function titleCase(s: string) {
  return s.split(/[-\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function StickyShopCategoryNav({ activeCategory }: { activeCategory?: string }) {
  const { categories, labelsBySlug, loading } = useCategoryTree()
  const [hovered, setHovered] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
        setMobileExpanded(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const realCategories = loading
    ? [...CATEGORY_SORT_ORDER]
    : categories.length
      ? categories
        .filter((c) => c.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((c) => c.slug)
      : [...CATEGORY_SORT_ORDER]

  const pills: { label: string; value: string; hasDropdown: boolean; children: string[] }[] = [
    { label: 'All', value: 'All', hasDropdown: false, children: [] },
    ...realCategories.map((c) => {
      const label = labelsBySlug[c] ?? CATEGORY_LABELS[c] ?? titleCase(c)
      const children = categories?.length
        ? categories.find((cat) => cat.slug === c)?.children.map((s) => s.slug) ?? []
        : (SUBS_BY_CAT[c] ?? [])
      return { label, value: c, hasDropdown: children.length > 0, children }
    }),
    { label: 'Featured', value: 'Featured', hasDropdown: false, children: [] },
    { label: 'New Arrivals', value: 'New Arrivals', hasDropdown: false, children: [] },
    { label: 'Sales & Clearance', value: 'Sales & Clearance', hasDropdown: false, children: [] },
    { label: 'Blanks', value: 'Blanks', hasDropdown: false, children: [] },
  ]

  function handleMouseEnter(value: string) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHovered(value)
  }

  function handleMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => setHovered(null), 150)
  }

  function subLink(category: string, sub: string) {
    return `/shop?category=${encodeURIComponent(category)}&sub=${encodeURIComponent(sub)}`
  }

  function allLink(category: string) {
    return `/shop?category=${encodeURIComponent(category)}`
  }

  return (
    <div
      ref={navRef}
      className="sticky z-20 border-y border-jays-navy/10 bg-white shadow-[0_1px_0_rgba(19,74,142,0.06)]"
      style={{ top: 'calc(var(--header-height, 3.5rem) + var(--subnav-height, 2.75rem))' }}
    >
      <div className="relative mx-auto flex w-full max-w-none items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-1 py-2.5 md:flex">
          {pills.map(({ label, value, hasDropdown, children }) => {
            const active = activeCategory?.toLowerCase() === value.toLowerCase()
            return (
              <div
                key={value}
                className="relative"
                onMouseEnter={() => handleMouseEnter(value)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={value === 'All' ? '/shop?category=All' : allLink(value)}
                  className={`
                    inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all
                    ${active
                      ? 'bg-jays-navy text-white shadow-sm'
                      : 'text-jays-navy hover:bg-jays-ice/60'}
                  `}
                >
                  {label}
                  {hasDropdown && (
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${hovered === value ? 'rotate-180' : ''}`}
                    />
                  )}
                </Link>

                {hasDropdown && hovered === value && (
                  <div className="absolute left-0 top-full z-30 w-56 pt-2">
                    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-xl shadow-black/10">
                      <Link
                        href={allLink(value)}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-jays-navy hover:bg-jays-ice/60"
                      >
                        All {label}
                      </Link>
                      <div className="my-2 h-px bg-gray-100" />
                      {children.map((sub) => (
                        <Link
                          key={sub}
                          href={subLink(value, sub)}
                          className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                        >
                          {labelsBySlug[sub] ?? titleCase(sub)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex w-full items-center justify-between py-2.5 md:hidden">
          <span className="text-sm font-semibold text-jays-navy">
            {activeCategory && activeCategory !== 'All'
              ? (labelsBySlug[activeCategory.toLowerCase()] ?? titleCase(activeCategory))
              : 'Shop Categories'}
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-jays-ice/60 px-3 py-1.5 text-xs font-semibold text-jays-navy"
          >
            {mobileOpen ? <X size={14} /> : <Menu size={14} />}
            {mobileOpen ? 'Close' : 'Categories'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          {pills.map(({ label, value, hasDropdown, children }) => {
            const active = activeCategory?.toLowerCase() === value.toLowerCase()
            const expanded = mobileExpanded === value
            return (
              <div key={value} className="border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between py-2">
                  <Link
                    href={value === 'All' ? '/shop?category=All' : allLink(value)}
                    onClick={() => { setMobileOpen(false); setMobileExpanded(null) }}
                    className={`text-sm font-semibold ${active ? 'text-jays-navy' : 'text-gray-700'}`}
                  >
                    {label}
                  </Link>
                  {hasDropdown && (
                    <button
                      type="button"
                      onClick={() => setMobileExpanded(expanded ? null : value)}
                      className="p-1 text-jays-steel"
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {hasDropdown && expanded && (
                  <div className="pb-2 pl-3">
                    {children.map((sub) => (
                      <Link
                        key={sub}
                        href={subLink(value, sub)}
                        onClick={() => { setMobileOpen(false); setMobileExpanded(null) }}
                        className="block py-1.5 text-sm text-gray-600 hover:text-jays-navy"
                      >
                        {labelsBySlug[sub] ?? titleCase(sub)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
