'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { SUBS_BY_CAT, BRANDS_BY_CAT, HAT_STYLES } from '@/lib/constants'

const CATEGORY_LABELS: Record<string, string> = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  accessories: 'Accessories',
  authentication: 'Authentication',
  sport: 'Sport',
}

const CATEGORY_SORT_ORDER = ['men', 'women', 'kids', 'accessories', 'sport', 'authentication']

function titleCase(s: string) {
  return s.split(/[-\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

interface StickyShopCategoryNavProps {
  activeCategory?: string
  onSelect?: (category: string, sub: string, brand: string, hatStyle: string) => void
}

export default function StickyShopCategoryNav({ activeCategory, onSelect }: StickyShopCategoryNavProps) {
  const { categories, labelsBySlug, loading } = useCategoryTree()
  const [hovered, setHovered] = useState<{ category: string | null; sub: string | null; brand: string | null }>({
    category: null,
    sub: null,
    brand: null,
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, string | null>>({})
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
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

  function handleMouseEnter(category: string) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHovered({ category, sub: null, brand: null })
  }

  function handleSubMouseEnter(category: string, sub: string) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHovered({ category, sub, brand: null })
  }

  function handleBrandMouseEnter(category: string, sub: string, brand: string) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHovered({ category, sub, brand })
  }

  function handleMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => setHovered({ category: null, sub: null, brand: null }), 150)
  }

  function apply(category: string, sub: string, brand: string, hatStyle: string) {
    onSelect?.(category, sub, brand, hatStyle)
  }

  function subLink(category: string, sub: string, brand: string) {
    if (brand && brand !== 'All') {
      return `/shop?category=${encodeURIComponent(category)}&sub=${encodeURIComponent(sub)}&brand=${encodeURIComponent(brand)}`
    }
    return `/shop?category=${encodeURIComponent(category)}&sub=${encodeURIComponent(sub)}`
  }

  function allLink(category: string) {
    return `/shop?category=${encodeURIComponent(category)}`
  }

  function availableBrands(category: string): string[] {
    return BRANDS_BY_CAT[category.toLowerCase()] ?? []
  }

  return (
    <div
      ref={navRef}
      className="sticky z-30 border-y border-jays-navy/10 bg-white shadow-[0_1px_0_rgba(19,74,142,0.06)]"
      style={{ top: 'calc(var(--header-height, 3.5rem) + var(--subnav-height, 2.75rem))' }}
    >
      <div className="relative mx-auto flex w-full max-w-none items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="hidden items-center gap-1 py-2.5 md:flex" onMouseLeave={handleMouseLeave}>
          {pills.map(({ label, value, hasDropdown, children }) => {
            const active = activeCategory?.toLowerCase() === value.toLowerCase()
            const isHovered = hovered.category === value
            return (
              <div key={value} className="relative" onMouseEnter={() => handleMouseEnter(value)}>
                <Link
                  href={value === 'All' ? '/shop?category=All' : allLink(value)}
                  onClick={() => apply(value, 'All', 'All', 'All')}
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
                      className={`transition-transform duration-200 ${isHovered ? 'rotate-180' : ''}`}
                    />
                  )}
                </Link>

                {hasDropdown && isHovered && (
                  <div className="absolute left-0 top-full z-40 min-w-[16rem] pt-2" onMouseEnter={() => handleMouseEnter(value)}>
                    <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-black/10">
                      <Link
                        href={allLink(value)}
                        onClick={() => apply(value, 'All', 'All', 'All')}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-jays-navy hover:bg-jays-ice/60"
                      >
                        All {label}
                      </Link>
                      <div className="my-1.5 h-px bg-gray-100" />
                      {children.map((sub) => {
                        const subHovered = hovered.sub === sub
                        const brands = sub === 'hats' ? availableBrands(value) : []
                        return (
                          <div key={sub} className="relative" onMouseEnter={() => handleSubMouseEnter(value, sub)}>
                            <Link
                              href={subLink(value, sub, 'All')}
                              onClick={() => apply(value, sub, 'All', 'All')}
                              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                            >
                              <span>{labelsBySlug[sub] ?? titleCase(sub)}</span>
                              {brands.length > 0 && (
                                <ChevronDown
                                  size={12}
                                  className={`rotate-[-90deg] text-gray-400 transition-transform ${subHovered ? 'text-jays-navy' : ''}`}
                                />
                              )}
                            </Link>

                            {brands.length > 0 && subHovered && (
                              <div className="absolute left-full top-0 z-50 ml-1 min-w-[15rem] pl-1" onMouseEnter={() => handleSubMouseEnter(value, sub)}>
                                <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-black/10">
                                  {brands.map((brand) => {
                                    const brandHovered = hovered.brand === brand
                                    return (
                                      <div key={brand} className="relative" onMouseEnter={() => handleBrandMouseEnter(value, sub, brand)}>
                                        <Link
                                          href={subLink(value, sub, brand)}
                                          onClick={() => apply(value, sub, brand, 'All')}
                                          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                                        >
                                          <span>{brand}</span>
                                          <ChevronDown
                                            size={12}
                                            className={`rotate-[-90deg] text-gray-400 transition-transform ${brandHovered ? 'text-jays-navy' : ''}`}
                                          />
                                        </Link>

                                        {brandHovered && (
                                          <div className="absolute left-full top-0 z-50 ml-1 min-w-[13rem] pl-1" onMouseEnter={() => handleBrandMouseEnter(value, sub, brand)}>
                                            <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-black/10">
                                              {HAT_STYLES.map((style) => (
                                                <Link
                                                  key={style}
                                                  href={`/shop?category=${encodeURIComponent(value)}&sub=${encodeURIComponent(sub)}&brand=${encodeURIComponent(brand)}&hatStyle=${encodeURIComponent(style)}`}
                                                  onClick={() => apply(value, sub, brand, style)}
                                                  className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                                                >
                                                  {style}
                                                </Link>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
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
            const expandedCat = mobileExpanded.category === value
            return (
              <div key={value} className="border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between py-2">
                  <Link
                    href={value === 'All' ? '/shop?category=All' : allLink(value)}
                    onClick={() => { setMobileOpen(false); apply(value, 'All', 'All', 'All') }}
                    className={`text-sm font-semibold ${active ? 'text-jays-navy' : 'text-gray-700'}`}
                  >
                    {label}
                  </Link>
                  {hasDropdown && (
                    <button
                      type="button"
                      onClick={() =>
                        setMobileExpanded((prev) => ({
                          ...prev,
                          category: prev.category === value ? null : value,
                          sub: null,
                          brand: null,
                        }))}
                      className="p-1 text-jays-steel"
                      aria-label={expandedCat ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown size={16} className={`transition-transform ${expandedCat ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {hasDropdown && expandedCat && (
                  <div className="pb-2 pl-3">
                    {children.map((sub) => {
                      const subKey = `${value}:${sub}`
                      const expandedSub = mobileExpanded.sub === subKey
                      const brands = sub === 'hats' ? availableBrands(value) : []
                      return (
                        <div key={sub} className="border-b border-gray-50 last:border-0">
                          <div className="flex items-center justify-between py-1.5">
                            <Link
                              href={subLink(value, sub, 'All')}
                              onClick={() => { setMobileOpen(false); apply(value, sub, 'All', 'All') }}
                              className="text-sm text-gray-600 hover:text-jays-navy"
                            >
                              {labelsBySlug[sub] ?? titleCase(sub)}
                            </Link>
                            {brands.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setMobileExpanded((prev) => ({
                                    ...prev,
                                    sub: prev.sub === subKey ? null : subKey,
                                    brand: null,
                                  }))}
                                className="p-1 text-jays-steel"
                              >
                                <ChevronDown size={14} className={`transition-transform ${expandedSub ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>
                          {expandedSub && brands.length > 0 && (
                            <div className="pb-1 pl-3">
                              {brands.map((brand) => {
                                const brandKey = `${value}:${sub}:${brand}`
                                const expandedBrand = mobileExpanded.brand === brandKey
                                return (
                                  <div key={brand} className="border-b border-gray-50 last:border-0">
                                    <div className="flex items-center justify-between py-1">
                                      <Link
                                        href={subLink(value, sub, brand)}
                                        onClick={() => { setMobileOpen(false); apply(value, sub, brand, 'All') }}
                                        className="text-sm text-gray-600 hover:text-jays-navy"
                                      >
                                        {brand}
                                      </Link>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setMobileExpanded((prev) => ({
                                            ...prev,
                                            brand: prev.brand === brandKey ? null : brandKey,
                                          }))}
                                        className="p-1 text-jays-steel"
                                      >
                                        <ChevronDown size={14} className={`transition-transform ${expandedBrand ? 'rotate-180' : ''}`} />
                                      </button>
                                    </div>
                                    {expandedBrand && (
                                      <div className="pb-1 pl-3">
                                        {HAT_STYLES.map((style) => (
                                          <Link
                                            key={style}
                                            href={`/shop?category=${encodeURIComponent(value)}&sub=${encodeURIComponent(sub)}&brand=${encodeURIComponent(brand)}&hatStyle=${encodeURIComponent(style)}`}
                                            onClick={() => { setMobileOpen(false); apply(value, sub, brand, style) }}
                                            className="block py-1 text-sm text-gray-600 hover:text-jays-navy"
                                          >
                                            {style}
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
                    })}
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
