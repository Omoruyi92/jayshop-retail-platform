'use client'

import { useState, useEffect, useRef, type MouseEvent as ReactMouseEvent, type FocusEvent as ReactFocusEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useCategoryTree, type CategoryNode } from '@/hooks/useCategoryTree'
import { SUBS_BY_CAT, HAT_STYLES, AUDIENCES, KIDS_AGE_GROUPS, displayCategoryName } from '@/lib/constants'

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
  initialCategories?: CategoryNode[]
}

export default function StickyShopCategoryNav({ activeCategory, onSelect, initialCategories }: StickyShopCategoryNavProps) {
  const router = useRouter()
  const { categories, labelsBySlug, loading, productTypesBySlug, brandsBySlug } = useCategoryTree(initialCategories)
  const [hovered, setHovered] = useState<{ category: string | null; sub: string | null; brand: string | null }>({
    category: null,
    sub: null,
    brand: null,
  })
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null)
  // Fixed-position (viewport) coordinates for each category's top-level
  // dropdown panel, computed from the trigger's own rect at hover/focus
  // time. The panel is rendered via a portal (see below) rather than as a
  // normal absolute-positioned descendant of the horizontally-scrollable
  // pills row, so these pixel coordinates replace the old 'left'/'right'
  // side-flip class toggling.
  const [menuPos, setMenuPos] = useState<Record<string, { top: number; left: number }>>({})
  const [subSide, setSubSide] = useState<Record<string, 'left' | 'right'>>({})
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, string | null>>({})
  const [mounted, setMounted] = useState(false)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const categoryRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const lastFocusedCategory = useRef<string | null>(null)
  const menuPanelRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [])

  useEffect(() => {
    if (lastFocusedCategory.current && categoryRefs.current[lastFocusedCategory.current]) {
      categoryRefs.current[lastFocusedCategory.current]?.focus({ preventScroll: true })
    }
  }, [activeCategory])

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
    return productTypesBySlug[category.toLowerCase()] ?? []
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

  function handleMouseEnter(category: string, e?: ReactMouseEvent<HTMLElement>) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHovered({ category, sub: null, brand: null })
    setHoveredAttr(null)
    if (e && typeof window !== 'undefined') {
      const rect = e.currentTarget.getBoundingClientRect()
      const MENU_WIDTH = 288 // matches min-w-[18rem]
      const GAP = 8 // matches the previous pt-2 gap
      const overflowsRight = rect.left + MENU_WIDTH > window.innerWidth - 16
      const left = overflowsRight ? Math.max(16, rect.right - MENU_WIDTH) : rect.left
      setMenuPos((prev) => ({ ...prev, [category]: { top: rect.bottom + GAP, left } }))
    }
  }

  function handleSubMouseEnter(category: string, sub: string, e?: ReactMouseEvent<HTMLElement>) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHovered({ category, sub, brand: null })
    setHoveredAttr(null)
    if (e && typeof window !== 'undefined') {
      const rect = e.currentTarget.getBoundingClientRect()
      const FLYOUT_WIDTH = 224 // matches min-w-[14rem]
      const overflowsRight = rect.right + FLYOUT_WIDTH > window.innerWidth - 16
      setSubSide((prev) => ({ ...prev, [`${category}:${sub}`]: overflowsRight ? 'right' : 'left' }))
    }
  }

  function handleAttrMouseEnter(attr: string) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHoveredAttr(attr)
  }

  // Opens a category dropdown on focus (e.g. Tab into the trigger link),
  // mirroring handleMouseEnter but without requiring a MouseEvent (position
  // is measured from the focused element's own rect instead).
  function handleCategoryFocus(category: string, e: ReactFocusEvent<HTMLElement>) {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHovered({ category, sub: null, brand: null })
    setHoveredAttr(null)
    if (typeof window !== 'undefined') {
      const rect = e.currentTarget.getBoundingClientRect()
      const MENU_WIDTH = 288
      const GAP = 8
      const overflowsRight = rect.left + MENU_WIDTH > window.innerWidth - 16
      const left = overflowsRight ? Math.max(16, rect.right - MENU_WIDTH) : rect.left
      setMenuPos((prev) => ({ ...prev, [category]: { top: rect.bottom + GAP, left } }))
    }
  }

  // Closes the open dropdown (Escape) and restores focus to the trigger
  // that opened it, so keyboard users don't lose their place.
  function closeDropdownAndRestoreFocus(category: string) {
    setHovered({ category: null, sub: null, brand: null })
    setHoveredAttr(null)
    categoryRefs.current[category]?.focus()
  }

  // Escape closes the dropdown from anywhere inside the trigger or panel.
  // ArrowDown from the trigger moves focus into the first item of the open
  // panel so keyboard users can navigate the menu without a mouse.
  function handleTriggerKeyDown(e: ReactKeyboardEvent<HTMLElement>, category: string, isOpen: boolean) {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      closeDropdownAndRestoreFocus(category)
      return
    }
    if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault()
      const panel = menuPanelRefs.current[category]
      const firstLink = panel?.querySelector<HTMLElement>('a, button')
      firstLink?.focus()
    }
  }

  // Within an open dropdown panel: Escape closes + restores focus to the
  // trigger; ArrowUp/ArrowDown move between the panel's focusable items.
  function handlePanelKeyDown(e: ReactKeyboardEvent<HTMLElement>, category: string) {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeDropdownAndRestoreFocus(category)
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const panel = menuPanelRefs.current[category]
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>('a, button'))
      const currentIndex = items.indexOf(document.activeElement as HTMLElement)
      if (currentIndex === -1) return
      e.preventDefault()
      const nextIndex = e.key === 'ArrowDown'
        ? Math.min(currentIndex + 1, items.length - 1)
        : Math.max(currentIndex - 1, 0)
      items[nextIndex]?.focus()
    }
  }

  // Cancels the pending close timeout without recomputing menu/sub side.
  // Used on the dropdown panels themselves so moving the mouse from the
  // trigger into the open panel never re-measures position (that caused a
  // visible horizontal jump since the panel's own rect differs from the
  // trigger's rect).
  function keepOpen() {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
  }

  function handleMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered({ category: null, sub: null, brand: null })
      setHoveredAttr(null)
    }, 300)
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
    // scroll: false — category/sub/attribute clicks are in-page filter
    // changes, not a navigation to a new destination the user expects to
    // land at the top of. Without this, Next.js's default App Router
    // scroll-restoration snaps the page back to y=0 on every click, so a
    // user browsing partway down the grid loses their position and has to
    // scroll back down past the (now sticky) category nav. A full
    // page refresh/reload still starts at the top via the browser's own
    // native (unrelated) scroll behavior, so that expectation is preserved.
    router.push(`/shop?${params.toString()}`, { scroll: false })
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
    return brandsBySlug[category.toLowerCase()] ?? []
  }

  // Closes the dropdown when focus moves outside the trigger+panel group
  // entirely (e.g. Tab past the last item), but not when it's just moving
  // between the trigger and its own panel. The panel is portaled to
  // document.body (see render below) so it's no longer a DOM descendant of
  // the trigger's wrapper div — check the portaled panel node explicitly
  // too, or focus moving from the trigger into its own dropdown would be
  // (incorrectly) treated as leaving the group and close the menu.
  function handleGroupBlur(e: ReactFocusEvent<HTMLDivElement>, category: string) {
    const next = e.relatedTarget as Node | null
    const panel = menuPanelRefs.current[category]
    const stillInside = !!next && (e.currentTarget.contains(next) || (panel && panel.contains(next)))
    if (!next || !stillInside) {
      setHovered((prev) => (prev.category === category ? { category: null, sub: null, brand: null } : prev))
    }
  }

  return (
    <div
      ref={navRef}
      // Sticky (not fixed) and stacked directly beneath SubNavBar via the
      // combined --header-height + --subnav-height offset, so Header,
      // SubNavBar, and this category nav pin/unpin together as a single
      // coordinated unit under native browser scroll handling. This
      // replaces the previous `fixed` + JS scroll-direction show/hide
      // (translate-y transition), which animated independently from
      // SubNavBar's native sticky motion and caused a visible double-nav
      // overlap/flicker during scroll (both bars occupying the same band
      // at slightly different times).
      className={`sticky border-y border-jays-navy/10 bg-white shadow-[0_1px_0_rgba(19,74,142,0.06)] ${
        // Elevate above the mobile BottomNav (z-40) only while the mobile
        // category dropdown is open, so its expanded panel never renders
        // underneath/gets visually collided with the fixed bottom nav bar.
        // Otherwise keep the normal z-30 stacking (consistent with
        // Footer/SubNavBar) so it stays below the site Header (z-40).
        mobileOpen ? 'z-50' : 'z-30'
      }`}
      style={{ top: 'calc(var(--header-height, 3.5rem) + var(--subnav-height, 2.75rem))' }}
    >
      <div className="relative mx-auto flex w-full max-w-none items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="hidden max-w-full items-center justify-center gap-1 overflow-x-auto py-2.5 md:flex" onMouseLeave={handleMouseLeave}>
          {pills.map(({ label, value, hasDropdown, children }) => {
            const active = activeCategory?.toLowerCase() === value.toLowerCase()
            const isHovered = hovered.category === value
            return (
              <div
                key={value}
                className="relative"
                onMouseEnter={(e) => handleMouseEnter(value, e)}
                onBlur={(e) => handleGroupBlur(e, value)}
              >
                <Link
                  ref={(el) => { categoryRefs.current[value] = el }}
                  href={value === 'All' ? '/shop?category=All' : allLink(value)}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(value, 'All', 'All', 'All')
                  }}
                  onFocus={hasDropdown ? (e) => handleCategoryFocus(value, e) : undefined}
                  onKeyDown={hasDropdown ? (e) => handleTriggerKeyDown(e, value, isHovered) : undefined}
                  aria-haspopup={hasDropdown ? 'true' : undefined}
                  aria-expanded={hasDropdown ? isHovered : undefined}
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

                {hasDropdown && isHovered && mounted && menuPos[value] && createPortal(
                  // Rendered via a portal to document.body (fixed viewport
                  // coordinates computed on hover/focus, see handleMouseEnter/
                  // handleCategoryFocus) instead of as an absolute descendant
                  // of the horizontally-scrollable pills row above. That row
                  // has `overflow-x-auto`, and per the CSS overflow spec a
                  // container with only one axis set to non-'visible' has its
                  // *other* axis computed to 'auto' too — so any dropdown
                  // nested inside it was being silently clipped the instant
                  // it extended past the row's own (48px-tall) box. It never
                  // rendered, even though the trigger's active/expanded state
                  // (chevron flip) looked correct — an invisible, effectively
                  // non-functional "empty" nav dropdown. The portal sidesteps
                  // any ancestor overflow entirely.
                  <div
                    ref={(el) => { menuPanelRefs.current[value] = el }}
                    role="menu"
                    className="fixed z-[100] min-w-[18rem]"
                    style={{ top: menuPos[value].top, left: menuPos[value].left }}
                    onMouseEnter={keepOpen}
                    onMouseLeave={handleMouseLeave}
                    onKeyDown={(e) => handlePanelKeyDown(e, value)}
                  >
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
                          <div key={sub} className="relative" onMouseEnter={(e) => handleSubMouseEnter(value, sub, e)}>
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
                              <div
                                className={`absolute top-0 z-50 min-w-[14rem] ${
                                  subSide[`${value}:${sub}`] === 'right' ? 'right-full pr-1' : 'left-full pl-1'
                                }`}
                                onMouseEnter={keepOpen}
                              >
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
                                    </>
                                  )}

                                  {(isHatCategory || brands.length > 0) && (
                                    <>
                                      {audiences.length > 0 && <div className="my-1.5 h-px bg-gray-100" />}
                                      <div className="flex items-center gap-3">
                                        {isHatCategory && (
                                          <div className="relative" onMouseEnter={() => handleAttrMouseEnter('hatStyle')}>
                                            <button
                                              type="button"
                                              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-jays-ice/60 hover:text-jays-navy ${
                                                hoveredAttr === 'hatStyle' ? 'bg-jays-ice/60 text-jays-navy' : 'text-gray-700'
                                              }`}
                                            >
                                              Hat Styles
                                              <ChevronDown size={12} className="text-gray-400" />
                                            </button>
                                            {hoveredAttr === 'hatStyle' && (
                                              <div className="absolute left-0 top-full z-50 pt-1 min-w-[10rem]" onMouseEnter={() => handleAttrMouseEnter('hatStyle')}>
                                                <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-black/10">
                                                  {HAT_STYLES.map((style) => (
                                                    <Link
                                                      key={style}
                                                      href={`/shop?category=${encodeURIComponent(value)}&sub=${encodeURIComponent(sub)}&hatStyle=${encodeURIComponent(style)}`}
                                                      onClick={(e) => {
                                                        e.preventDefault()
                                                        navigate(value, sub, 'All', style)
                                                      }}
                                                      className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                                                    >
                                                      {style}
                                                    </Link>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        {brands.length > 0 && (
                                          <div className="relative" onMouseEnter={() => handleAttrMouseEnter('brand')}>
                                            <button
                                              type="button"
                                              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-jays-ice/60 hover:text-jays-navy ${
                                                hoveredAttr === 'brand' ? 'bg-jays-ice/60 text-jays-navy' : 'text-gray-700'
                                              }`}
                                            >
                                              Brands
                                              <ChevronDown size={12} className="text-gray-400" />
                                            </button>
                                            {hoveredAttr === 'brand' && (
                                              <div className="absolute right-0 top-full z-50 pt-1 min-w-[10rem]" onMouseEnter={() => handleAttrMouseEnter('brand')}>
                                                <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-xl shadow-black/10">
                                                  {brands.map((brand) => (
                                                    <Link
                                                      key={brand}
                                                      href={subLink(value, sub, brand)}
                                                      onClick={(e) => {
                                                        e.preventDefault()
                                                        navigate(value, sub, brand, 'All')
                                                      }}
                                                      className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-jays-ice/60 hover:text-jays-navy"
                                                    >
                                                      {brand}
                                                    </Link>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>,
                  document.body
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
        <div
          className="border-t border-gray-100 bg-white px-4 py-3 md:hidden overflow-y-auto overscroll-contain"
          style={{ maxHeight: 'calc(100vh - var(--header-height, 3.5rem) - var(--subnav-height, 2.75rem) - 3rem)', WebkitOverflowScrolling: 'touch' }}
        >
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
                      const audiences = audienceOptions(value)
                      const brands = availableBrands(value)
                      const isHatCategory = sub.toLowerCase() === 'hats' || sub.toLowerCase() === 'caps'
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
                            {(audiences.length > 0 || brands.length > 0 || isHatCategory) && (
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
                              {audiences.length > 0 && (
                                <>
                                  <p className="py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    {value.toLowerCase() === 'kids' ? 'Age Group' : 'Audience'}
                                  </p>
                                  {audiences.map((aud) => (
                                    <Link
                                      key={aud}
                                      href={`/shop?category=${encodeURIComponent(value)}&sub=${encodeURIComponent(sub)}&${value.toLowerCase() === 'kids' ? 'ageGroup' : 'audience'}=${encodeURIComponent(aud)}`}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        setMobileOpen(false)
                                        if (value.toLowerCase() === 'kids') {
                                          navigate(value, sub, 'All', 'All', undefined, aud)
                                        } else {
                                          navigate(value, sub, 'All', 'All', aud)
                                        }
                                      }}
                                      className="block py-1 text-sm text-gray-600 hover:text-jays-navy"
                                    >
                                      {aud}
                                    </Link>
                                  ))}
                                </>
                              )}
                              {isHatCategory && (
                                <>
                                  {audiences.length > 0 && <div className="my-1 h-px bg-gray-100" />}
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
                                  {(audiences.length > 0 || isHatCategory) && <div className="my-1 h-px bg-gray-100" />}
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
