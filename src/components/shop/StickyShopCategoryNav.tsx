'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { SUBS_BY_CAT, BRANDS_BY_CAT, HAT_STYLES, PRODUCT_TYPES_BY_CAT, AUDIENCES, KIDS_AGE_GROUPS, displayCategoryName } from '@/lib/constants'

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  accessories: 'Accessories',
  authentication: 'Authentication',
  sport: 'Sport',
  blanks: 'Blanks',
  featured: 'Featured',
  'sales-clearance': 'Sales & Clearance',
}

const CATEGORY_SORT_ORDER = ['all', 'men', 'women', 'kids', 'accessories', 'sport', 'blanks', 'featured', 'authentication', 'sales-clearance']

function titleCase(s: string) {
  return s.split(/[-\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

interface StickyShopCategoryNavProps {
  activeCategory?: string
  onSelect?: (category: string, sub: string, brand: string, hatStyle: string) => void
}

export default function StickyShopCategoryNav({ activeCategory, onSelect }: StickyShopCategoryNavProps) {
  const router = useRouter()
  const { categories, labelsBySlug, loading } = useCategoryTree()
  const [hovered, setHovered] = useState<{ category: string | null; sub: string | null; brand: string | null }>({
    category: null,
    sub: null,
    brand: null,
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, string | null>>({})
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  const categoryRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const lastFocusedCategory = useRef<string | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (lastFocusedCategory.current && categoryRefs.current[lastFocusedCategory.current]) {
      categoryRefs.current[lastFocusedCategory.current]?.focus({ preventScroll: true })
    }
  }, [activeCategory])

  useEffect(() => {
    function onScroll() {
      const current = window.scrollY
      const delta = current - lastScrollY.current
      if (delta > 6) {
        setVisible(false)
      } else if (delta < -6) {
        setVisible(true)
      }
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const realCategories = loading
    ? [...CATEGORY_SORT_ORDER]
    : categories.length
      ? categories
        .filter((c) => c.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((c) => c.slug)
      : [...CATEGORY_SORT_ORDER]

  function audienceOptions(category: string): string[] {
    const c = category.toLowerCase()
    if (c === 'kids') return [...KIDS_AGE_GROUPS]
    if (['featured', 'sport', 'authentication', 'sales-clearance'].includes(c)) return [...AUDIENCES]
    return []
  }

  function productTypeOptions(category: string): string[] {
    return PRODUCT_TYPES_BY_CAT[category.toLowerCase()] ?? []
  }

  const allPills: { label: string; value: string; hasDropdown: boolean; children: string[] }[] = [
    { label: 'All', value: 'All', hasDropdown: false, children: [] },
    ...realCategories.map((c) => {
      const label = labelsBySlug[c] ?? CATEGORY_LABELS[c] ?? titleCase(c)
      const children = productTypeOptions(c)
      return { label, value: c, hasDropdown: children.length > 0, children }
    }),
  ]

  const pills = allPills.filter((p) => p.value === 'All' || p.hasDropdown || p.children.length > 0)

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

  function navigate(value: string, sub = 'All', brand = 'All', hatStyle = 'All', audience?: string, ageGroup?: string) {
    lastFocusedCategory.current = value
    apply(value, sub, brand, hatStyle)
    const params = new URLSearchParams()
    params.set('category', value)
    if (sub && sub !== 'All') params.set('sub', sub)
    if (brand && brand !== 'All') params.set('brand', brand)
    if (hatStyle && hatStyle !== 'All') params.set('hatStyle', hatStyle)
    if (audience && audience !== 'All') params.set('audience', audience)
    if (ageGroup && ageGroup !== 'All') params.set('ageGroup', ageGroup)
    router.push(`/shop?${params.toString()}`)
  }

  function subLink(category: string, sub: string, brand: string) {
    const params = new URLSearchParams({ category })
    if (sub && sub !== 'All') params.set('sub', sub)
    if (brand && brand !== 'All') params.set('brand', brand)
    return `/shop?${params.toString()}`
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
      className={`fixed left-0 right-0 z-30 border-y border-jays-navy/10 bg-white shadow-[0_1px_0_rgba(19,74,142,0.06)] transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{ top: 'calc(var(--header-height, 3.5rem))' }}
    >
      <div className="relative mx-auto flex w-full max-w-none items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="hidden items-center justify-center gap-1 py-2.5 md:flex" onMouseLeave={handleMouseLeave}>
          {pills.map(({ label, value, hasDropdown, children }) => {
            const active = activeCategory?.toLowerCase() === value.toLowerCase()
            const isHovered = hovered.category === value
            return (
              <div key={value} className="relative" onMouseEnter={() => handleMouseEnter(value)}>
                <Link
                  ref={(el) => { categoryRefs.current[value] = el }}
                  href={value === 'All' ? '/shop?category=All' : allLink(value)}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(value, 'All', 'All', 'All')
                  }}
                  className={`
                    inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jays-navy/40
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
                  <div className="absolute left-0 top-full z-40 min-w-[18rem] pt-2" onMouseEnter={() => handleMouseEnter(value)}>
                    <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-black/10">
                      <Link
                        href={allLink(value)}
                        onClick={(e) => {
                          e.preventDefault()
                          navigate(value, 'All', 'All', 'All')
                        }}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-jays-navy hover:bg-jays-ice/60"
                      >
                        All {label}
                      </Link>
                      <div className="my-1.5 h-px bg-gray-100" />
                      {children.map((sub) => {
                        const subHovered = hovered.sub === sub
                        const audiences = audienceOptions(value)
                        const brands = availableBrands(value)
                        const isHatCategory = sub.toLowerCase() === 'hats' || sub.toLowerCase() === 'caps'
                        return (
                          <div key={sub} className="relative" onMouseEnter={() => handleSubMouseEnter(value, sub)}>
                            <Link
                              href={subLink(value, sub, 'All')}
                              onClick={(e) => {
                                e.preventDefault()
                                navigate(value, sub, 'All', 'All')
                              }}
                              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                            >
                              <span>{labelsBySlug[sub.toLowerCase()] ?? titleCase(sub)}</span>
                              {(audiences.length > 0 || brands.length > 0 || isHatCategory) && (
                                <ChevronDown
                                  size={12}
                                  className={`rotate-[-90deg] text-gray-400 transition-transform ${subHovered ? 'text-jays-navy' : ''}`}
                                />
                              )}
                            </Link>

                            {subHovered && (
                              <div className="absolute left-full top-0 z-50 ml-1 min-w-[16rem] pl-1" onMouseEnter={() => handleSubMouseEnter(value, sub)}>
                                <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-black/10">
                                  {audiences.length > 0 && (
                                    <>
                                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                        {value.toLowerCase() === 'kids' ? 'Age Group' : 'Audience'}
                                      </p>
                                      {audiences.map((aud) => (
                                        <Link
                                          key={aud}
                                          href={`/shop?category=${encodeURIComponent(value)}&sub=${encodeURIComponent(sub)}&${value.toLowerCase() === 'kids' ? 'ageGroup' : 'audience'}=${encodeURIComponent(aud)}`}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            if (value.toLowerCase() === 'kids') {
                                              navigate(value, sub, 'All', 'All', undefined, aud)
                                            } else {
                                              navigate(value, sub, 'All', 'All', aud)
                                            }
                                          }}
                                          className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                                        >
                                          {aud}
                                        </Link>
                                      ))}
                                      <div className="my-1.5 h-px bg-gray-100" />
                                    </>
                                  )}
                                  {isHatCategory && (
                                    <>
                                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Hat Styles</p>
                                      {HAT_STYLES.map((style) => (
                                        <Link
                                          key={style}
                                          href={`/shop?category=${encodeURIComponent(value)}&sub=${encodeURIComponent(sub)}&hatStyle=${encodeURIComponent(style)}`}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            navigate(value, sub, 'All', style)
                                          }}
                                          className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                                        >
                                          {style}
                                        </Link>
                                      ))}
                                      <div className="my-1.5 h-px bg-gray-100" />
                                    </>
                                  )}
                                  {brands.length > 0 && (
                                    <>
                                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Brands</p>
                                      {brands.map((brand) => (
                                        <Link
                                          key={brand}
                                          href={subLink(value, sub, brand)}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            navigate(value, sub, brand, 'All')
                                          }}
                                          className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                                        >
                                          {brand}
                                        </Link>
                                      ))}
                                    </>
                                  )}
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
                        ref={(el) => { categoryRefs.current[value] = el }}
                        href={value === 'All' ? '/shop?category=All' : allLink(value)}
                        onClick={(e) => {
                          e.preventDefault()
                          setMobileOpen(false)
                          navigate(value, 'All', 'All', 'All')
                        }}
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
                      const productTypes = productTypeOptions(value)
                      const brands = availableBrands(value)
                      const isHatCategory = productTypes.some((p) => p.toLowerCase() === 'hats' || p.toLowerCase() === 'caps')
                      return (
                        <div key={sub} className="border-b border-gray-50 last:border-0">
                          <div className="flex items-center justify-between py-1.5">
                            <Link
                              href={subLink(value, sub, 'All')}
                              onClick={(e) => {
                                e.preventDefault()
                                setMobileOpen(false)
                                navigate(value, sub, 'All', 'All')
                              }}
                              className="text-sm text-gray-600 hover:text-jays-navy"
                            >
                              {labelsBySlug[sub.toLowerCase()] ?? titleCase(sub)}
                            </Link>
                            {(brands.length > 0 || isHatCategory) && (
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
                          {expandedSub && (
                            <div className="pb-1 pl-3">
                              {productTypes.map((pt) => (
                                <Link
                                  key={pt}
                                  href={subLink(value, sub, 'All')}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setMobileOpen(false)
                                    navigate(value, sub, 'All', 'All')
                                  }}
                                  className="block py-1 text-sm text-gray-600 hover:text-jays-navy"
                                >
                                  {pt}
                                </Link>
                              ))}
                              {isHatCategory && (
                                <>
                                  <p className="py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Hat Styles</p>
                                  {HAT_STYLES.map((style) => (
                                    <Link
                                      key={style}
                                      href={`/shop?category=${encodeURIComponent(value)}&sub=${encodeURIComponent(sub)}&hatStyle=${encodeURIComponent(style)}`}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setMobileOpen(false)
                                        navigate(value, sub, 'All', style)
                                      }}
                                      className="block py-1 text-sm text-gray-600 hover:text-jays-navy"
                                    >
                                      {style}
                                    </Link>
                                  ))}
                                </>
                              )}
                              {brands.length > 0 && (
                                <>
                                  <p className="py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Brands</p>
                                  {brands.map((brand) => (
                                    <Link
                                      key={brand}
                                      href={subLink(value, sub, brand)}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setMobileOpen(false)
                                        navigate(value, sub, brand, 'All')
                                      }}
                                      className="block py-1 text-sm text-gray-600 hover:text-jays-navy"
                                    >
                                      {brand}
                                    </Link>
                                  ))}
                                </>
                              )}
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
