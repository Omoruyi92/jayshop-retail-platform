'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '@/components/shop/ProductCard'
import ProductCarousel from '@/components/shop/ProductCarousel'
import Reveal from '@/components/ui/Reveal'
import ShopHero from '@/components/shop/ShopHero'
import type { Slide as HeroSlide } from '@/components/shop/HeroSlideshow'
import StickyShopCategoryNav from '@/components/shop/StickyShopCategoryNav'
import CategoryBanner from '@/components/shop/CategoryBanner'
import Dropdown from '@/components/ui/Dropdown'
import { EmptyState } from '@/components/ui/EmptyState'
import { HAT_STYLES, categoryHasAudience, categoryHasAgeGroup, AUDIENCES, KIDS_AGE_GROUPS } from '@/lib/constants'
import { titleCase } from '@/lib/text'
import { useCategoryTree, type CategoryNode } from '@/hooks/useCategoryTree'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { saveShopState, loadShopState, clearShopState, saveProductListContext } from '@/lib/shop/shopState'
import { useInventoryStream } from '@/hooks/useInventoryStream'

// Max products shown per category-grouped carousel row on the default,
// unfiltered Shop browsing view (see `isGroupedView` below) — mirrors the
// homepage preview sections (PlayerCatalogPreview/BrandCatalogPreview use
// 5-8), but a bit larger since each row here is the customer's primary way
// to browse a whole product type. "View All" surfaces the complete set.
const CAROUSEL_PREVIEW_COUNT = 10

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  priceCents: number
  imageUrl: string
  category: string
  subcategory: string
  productType?: string
  audience?: string
  ageGroup?: string
  hatStyle?: string
  quantity: number
  heldQuantity: number
  pickedQuantity: number
  sizes: string
  brand: string
  status: string
  isLicensed: boolean
  isChampion: boolean
  isFeatured: boolean
  isNewArrival: boolean
  isClearance: boolean
  isBlankJersey: boolean
  isCityConnect: boolean
  isChampionshipGear: boolean
  salePriceCents: number
  createdAt: Date
  updatedAt: Date
  remaining: number
  hasSizes?: boolean
  allSizesOos?: boolean
}

const SPECIAL_CATEGORIES = new Set(['Featured', 'New Arrivals', 'Sales & Clearance', 'Blanks', 'city-connect', 'championship-gear'])

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Standard Catalog Arrangement' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
]

const PRICE_RANGES: { value: string; label: string; min: number; max: number }[] = [
  { value: 'All', label: 'All Prices', min: 0, max: Infinity },
  { value: 'under-25', label: 'Under $25', min: 0, max: 2499 },
  { value: '25-50', label: '$25 – $50', min: 2500, max: 4999 },
  { value: '50-100', label: '$50 – $100', min: 5000, max: 9999 },
  { value: '100-plus', label: '$100+', min: 10000, max: Infinity },
]

function effectivePriceCents(product: Product): number {
  return product.salePriceCents > 0 && product.salePriceCents < product.priceCents
    ? product.salePriceCents
    : product.priceCents
}

function categoryMatches(product: Product, activeCategory: string): boolean {
  const cat = activeCategory.trim()
  const catLower = cat.toLowerCase()
  if (cat === 'All' || catLower === 'all') return true
  if (catLower === 'featured') return product.isFeatured
  if (catLower === 'new-arrivals' || catLower === 'new arrivals' || catLower === 'new') return product.isNewArrival
  if (catLower === 'sales-clearance' || catLower === 'sales & clearance' || catLower === 'sales clearance' || catLower === 'clearance' || catLower === 'sale') {
    return product.isClearance || product.salePriceCents > 0
  }
  if (catLower === 'blanks' || catLower === 'blank') return product.isBlankJersey
  if (catLower === 'city-connect' || catLower === 'city connect') return product.isCityConnect
  if (catLower === 'championship-gear' || catLower === 'championship gear') return product.isChampionshipGear
  // Standard categories match by product.category; special categories are handled above.
  return product.category.toLowerCase() === catLower
}

function normalizeProductType(product: Product): string {
  return (product.productType || product.subcategory || '').toLowerCase()
}

function productTypeMatches(product: Product, activeSub: string): boolean {
  if (activeSub === 'All') return true
  const target = activeSub.toLowerCase()
  // Backward compatibility: older products store product type in subcategory.
  return normalizeProductType(product) === target
}

function audienceMatches(product: Product, activeAudience: string): boolean {
  if (activeAudience === 'All') return true
  return (product.audience || '').toLowerCase() === activeAudience.toLowerCase()
}

function ageGroupMatches(product: Product, activeAgeGroup: string): boolean {
  if (activeAgeGroup === 'All') return true
  return (product.ageGroup || '').toLowerCase() === activeAgeGroup.toLowerCase()
}

function hatStyleMatches(product: Product, activeHatStyle: string): boolean {
  if (activeHatStyle === 'All') return true
  return (product.hatStyle || '').toLowerCase() === activeHatStyle.toLowerCase()
}

function brandMatches(product: Product, activeBrand: string): boolean {
  if (activeBrand === 'All') return true
  return product.brand.toLowerCase() === activeBrand.toLowerCase()
}

function PillRow({
  label,
  options,
  active,
  onSelect,
  formatLabel,
}: {
  label: string
  options: string[]
  active: string
  onSelect: (value: string) => void
  formatLabel?: (value: string) => string
}) {
  if (options.length === 0) return null
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-jays-steel/70">{label}</p>
      <div className="flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto scroll-px-1 pb-1 scrollbar-hide [mask-image:linear-gradient(to_right,transparent,black_10px,black_calc(100%-10px),transparent)] sm:[mask-image:none]">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-display font-semibold uppercase tracking-wide transition-all duration-300 ease-out ${
              active.toLowerCase() === option.toLowerCase()
                ? 'scale-[1.04] bg-gradient-to-r from-jays-navy to-jays-royal text-white shadow-md shadow-jays-navy/20'
                : 'border border-jays-navy/12 bg-white/90 text-jays-navy shadow-sm hover:-translate-y-0.5 hover:border-jays-navy/30 hover:bg-white hover:shadow-md'
            }`}
          >
            {formatLabel ? formatLabel(option) : option}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ShopPageClient({
  activeCategory: initialCategory,
  initialHeroSlides,
  initialCategories,
}: {
  activeCategory: string
  initialHeroSlides?: HeroSlide[]
  initialCategories?: CategoryNode[]
}) {
  const { t } = useLanguage()
  const { subsByCat, subPriorityBySlug, productTypesBySlug, brandsBySlug } = useCategoryTree(initialCategories)
  const s = t.shop
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [brandDirectory, setBrandDirectory] = useState<{ name: string; slug: string; imageUrl: string }[]>([])
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory || 'All')
  const [activeSub, setActiveSub] = useState<string>('All')
  const [activeAudience, setActiveAudience] = useState<string>('All')
  const [activeAgeGroup, setActiveAgeGroup] = useState<string>('All')
  const [activeHatStyle, setActiveHatStyle] = useState<string>('All')
  const [activeBrand, setActiveBrand] = useState<string>('All')
  const [activePriceRange, setActivePriceRange] = useState<string>('All')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [loading, setLoading] = useState(true)
  const [livePulse, setLivePulse] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const prevCountRef = useRef<number>(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasRestoredRef = useRef(false)
  const pendingScrollRef = useRef<number | null>(null)

  useEffect(() => {
    const saved = loadShopState()
    const urlCategory = searchParams?.get('category')?.trim()
    const urlSub = searchParams?.get('sub')?.trim()
    const urlAudience = searchParams?.get('audience')?.trim()
    const urlAgeGroup = searchParams?.get('ageGroup')?.trim()
    const urlBrand = searchParams?.get('brand')?.trim()
    const urlHatStyle = searchParams?.get('hatStyle')?.trim()
    if (urlCategory === 'All') {
      // Explicit reset request from the "All" pill — always show the full
      // catalog and discard any previously saved filter state. A "View All
      // [Type]" link from a category-grouped carousel row (e.g. "View All
      // Jerseys") still passes category=All (full catalog) alongside an
      // explicit sub, so that one filter is preserved instead of reset.
      clearShopState()
      setActiveCategory('All')
      setActiveSub(urlSub || 'All')
      setActiveAudience('All')
      setActiveAgeGroup('All')
      setActiveBrand('All')
      setActiveHatStyle('All')
      setActivePriceRange('All')
      setSearchInput('')
      setSearchQuery('')
      setSortBy('default')
      hasRestoredRef.current = true
      return
    }
    // `initialCategory` was computed server-side from the exact same URL
    // (see (public)/shop/page.tsx) and is what was already painted on first
    // render — StickyShopCategoryNav's active pill and the mobile label are
    // rendered from it before this effect ever runs. Restoring `saved.category`
    // here when it differs would silently swap the active category away from
    // what the user is already looking at (e.g. a plain `/shop` reload with
    // no category param, but a "women" filter left over from a previous
    // session) — an incorrect-state flash that never self-corrects. Saved
    // state is only for resuming sub-filters/scroll position within the SAME
    // category the URL/SSR already resolved to; a genuinely different saved
    // category is discarded rather than applied.
    const resolvedCategory = urlCategory || initialCategory || 'All'
    const canUseSaved = !!saved && saved.category.toLowerCase() === resolvedCategory.toLowerCase()
    if (canUseSaved && saved) {
      setActiveCategory(resolvedCategory)
      setActiveSub(urlSub || saved.sub)
      setActiveAudience(urlAudience || saved.audience || 'All')
      setActiveAgeGroup(urlAgeGroup || saved.ageGroup || 'All')
      setActiveBrand(urlBrand || saved.brand)
      setActiveHatStyle(urlHatStyle || saved.hatStyle || 'All')
      setSearchInput(saved.search)
      setSearchQuery(saved.search)
      pendingScrollRef.current = saved.scrollY
    } else {
      setActiveCategory(resolvedCategory)
      if (urlSub) setActiveSub(urlSub)
      if (urlAudience) setActiveAudience(urlAudience)
      if (urlAgeGroup) setActiveAgeGroup(urlAgeGroup)
      if (urlBrand) setActiveBrand(urlBrand)
      if (urlHatStyle) setActiveHatStyle(urlHatStyle)
    }
    hasRestoredRef.current = true
  }, [searchParams, initialCategory])

  useEffect(() => {
    const urlCategory = searchParams?.get('category')?.trim()
    const urlSub = searchParams?.get('sub')?.trim()
    const urlAudience = searchParams?.get('audience')?.trim()
    const urlAgeGroup = searchParams?.get('ageGroup')?.trim()
    const urlBrand = searchParams?.get('brand')?.trim()
    const urlHatStyle = searchParams?.get('hatStyle')?.trim()
    if (urlCategory === 'All') {
      setActiveCategory('All')
      setActiveSub(urlSub || 'All')
      setActiveAudience('All')
      setActiveAgeGroup('All')
      setActiveBrand('All')
      setActiveHatStyle('All')
      setActivePriceRange('All')
      setSearchInput('')
      setSearchQuery('')
      setSortBy('default')
      return
    }
    if (urlHatStyle) {
      setActiveHatStyle(urlHatStyle)
    }
    if (urlBrand) {
      setActiveBrand(urlBrand)
    }
    if (urlAudience) {
      setActiveAudience(urlAudience)
    }
    if (urlAgeGroup) {
      setActiveAgeGroup(urlAgeGroup)
    }
    if (!urlCategory) return
    setActiveCategory(urlCategory)
    setActiveSub(urlSub || 'All')
  }, [searchParams])

  useEffect(() => {
    if (!hasRestoredRef.current) return
    saveShopState({
      category: activeCategory,
      sub: activeSub,
      audience: activeAudience,
      ageGroup: activeAgeGroup,
      brand: activeBrand,
      hatStyle: activeHatStyle,
      search: searchQuery,
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    })
  }, [activeCategory, activeSub, activeAudience, activeAgeGroup, activeBrand, activeHatStyle, searchQuery])

  useEffect(() => {
    if (loading || pendingScrollRef.current === null) return
    const target = pendingScrollRef.current
    pendingScrollRef.current = null
    requestAnimationFrame(() => {
      window.scrollTo({ top: target, behavior: 'instant' })
    })
  }, [loading])

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchQuery(value), 250)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      const list: Product[] = data.products ?? []
      if (prevCountRef.current !== 0 && list.length !== prevCountRef.current) {
        setLivePulse(true)
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
        pulseTimerRef.current = setTimeout(() => setLivePulse(false), 2000)
      }
      prevCountRef.current = list.length
      setProducts(list)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    const interval = setInterval(fetchProducts, 30000)
    return () => clearInterval(interval)
  }, [fetchProducts])

  // Fetch the brand directory once so the active-brand indicator (shown when
  // arriving via the partner marquee or the Brands page) can display the
  // matching logo — same Brand records that drive /brands, single source of
  // truth for brand name -> logo lookups.
  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.brands)) setBrandDirectory(d.brands) })
      .catch(() => {})
  }, [])

  // Real-time sync: refetch the catalog immediately when any inventory or hold
  // mutation happens server-side, so stock badges/sold-out states never lag.
  useInventoryStream(
    {},
    {
      onInventoryChanged: fetchProducts,
      onHoldChanged: fetchProducts,
    }
  )

  const isSpecialCategory = SPECIAL_CATEGORIES.has(activeCategory)

  const productTypeOptions = activeCategory === 'All' || isSpecialCategory
    ? []
    : (productTypesBySlug[activeCategory.toLowerCase()] ?? [])
  const availableSubs = ['All', ...productTypeOptions]

  const showAudience = !isSpecialCategory && categoryHasAudience(activeCategory)
  const showAgeGroup = !isSpecialCategory && categoryHasAgeGroup(activeCategory)
  const audienceOptions = showAudience ? ['All', ...AUDIENCES] : []
  const ageGroupOptions = showAgeGroup ? ['All', ...KIDS_AGE_GROUPS] : []

  const availableHatStyles = ['All', ...HAT_STYLES]

  const catFilteredProducts = products.filter((product) => categoryMatches(product, activeCategory))
  const brandsFromProducts = Array.from(new Set(catFilteredProducts.map((product) => product.brand).filter(Boolean)))
  const predefinedBrands = activeCategory === 'All' || isSpecialCategory ? [] : (brandsBySlug[activeCategory.toLowerCase()] ?? [])
  const combinedBrands = Array.from(new Set([...predefinedBrands, ...brandsFromProducts]))
  const availableBrands = activeCategory === 'All' || isSpecialCategory ? [] : ['All', ...combinedBrands]

  const filtered = products.filter((product) => {
    const catMatch = categoryMatches(product, activeCategory)
    const subMatch = isSpecialCategory || productTypeMatches(product, activeSub)
    const audienceMatch = !showAudience || audienceMatches(product, activeAudience)
    const ageGroupMatch = !showAgeGroup || ageGroupMatches(product, activeAgeGroup)
    const hatStyleMatch = activeHatStyle === 'All' || hatStyleMatches(product, activeHatStyle)
    const brandMatch = isSpecialCategory || brandMatches(product, activeBrand)

    const range = PRICE_RANGES.find((r) => r.value === activePriceRange) ?? PRICE_RANGES[0]
    const price = effectivePriceCents(product)
    const priceMatch = price >= range.min && price <= range.max

    const stockMatch = !inStockOnly || (product.hasSizes ? !product.allSizesOos : product.remaining > 0)

    let searchMatch = true
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      searchMatch =
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        (product.description ?? '').toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        normalizeProductType(product).includes(query)
    }

    return catMatch && subMatch && audienceMatch && ageGroupMatch && hatStyleMatch && brandMatch && priceMatch && stockMatch && searchMatch
  })

  // Default catalog arrangement applies only when no explicit sort is chosen.
  const useMerchandisingOrder = sortBy === 'default'

  const sorted = [...filtered].sort((a, b) => {
    if (useMerchandisingOrder) {
      const FALLBACK_PRIORITY = 999
      const priorityA = subPriorityBySlug[normalizeProductType(a)] ?? FALLBACK_PRIORITY
      const priorityB = subPriorityBySlug[normalizeProductType(b)] ?? FALLBACK_PRIORITY
      if (priorityA !== priorityB) return priorityA - priorityB
      return effectivePriceCents(a) - effectivePriceCents(b)
    }
    switch (sortBy) {
      case 'price-asc':
        return effectivePriceCents(a) - effectivePriceCents(b)
      case 'price-desc':
        return effectivePriceCents(b) - effectivePriceCents(a)
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      default:
        return 0
    }
  })

  const isSearching = searchQuery.trim().length > 0
  const hasActiveFilters =
    isSearching ||
    activeCategory !== 'All' ||
    activeSub !== 'All' ||
    activeAudience !== 'All' ||
    activeAgeGroup !== 'All' ||
    activeHatStyle !== 'All' ||
    activeBrand !== 'All' ||
    activePriceRange !== 'All' ||
    inStockOnly

  // Category-organized browsing view: group products by their Type
  // (Jerseys, Hats, Fleece, ...) into separate labeled carousel rows,
  // rather than one flat interleaved grid. This is the default view for
  // "All" and for a top-level category (e.g. Men) with no further
  // filters/search applied — matching the merchandising priority order
  // already used for the flat catalog sort (subPriorityBySlug). As soon as
  // a customer narrows with a Type/brand/audience/price/stock filter or a
  // search term, that specific slice is better shown as a flat grid (more
  // predictable for browsability/scanning), so grouping is disabled then.
  const isGroupedView =
    !isSearching &&
    activeSub === 'All' &&
    activeAudience === 'All' &&
    activeAgeGroup === 'All' &&
    activeHatStyle === 'All' &&
    activeBrand === 'All' &&
    activePriceRange === 'All' &&
    !inStockOnly &&
    sortBy === 'default'

  const groupedSections = useMemo(() => {
    if (!isGroupedView) return []
    const FALLBACK_PRIORITY = 999
    const buckets = new Map<string, { label: string; products: Product[] }>()
    for (const product of filtered) {
      const key = normalizeProductType(product) || 'other'
      // productType is already properly cased (e.g. "T-Shirts") in the data;
      // only titleCase the subcategory fallback, which is a lowercase slug.
      const rawLabel = product.productType || titleCase(product.subcategory || '') || 'Other'
      const existing = buckets.get(key)
      if (existing) {
        existing.products.push(product)
      } else {
        buckets.set(key, { label: rawLabel, products: [product] })
      }
    }
    return Array.from(buckets.entries())
      .map(([key, group]) => ({ key, ...group }))
      .sort((a, b) => {
        const priorityA = subPriorityBySlug[a.key] ?? FALLBACK_PRIORITY
        const priorityB = subPriorityBySlug[b.key] ?? FALLBACK_PRIORITY
        if (priorityA !== priorityB) return priorityA - priorityB
        return a.label.localeCompare(b.label)
      })
  }, [isGroupedView, filtered, subPriorityBySlug])

  const currentFilters = {
    category: activeCategory,
    sub: activeSub,
    audience: activeAudience,
    ageGroup: activeAgeGroup,
    brand: activeBrand,
    hatStyle: activeHatStyle,
    search: searchInput,
  }

  const activeBrandInfo = activeBrand !== 'All'
    ? brandDirectory.find((b) => b.name.toLowerCase() === activeBrand.toLowerCase())
    : undefined

  function clearBrand() {
    setActiveBrand('All')
  }

  function handleCategoryNavSelect(category: string, sub: string, brand: string, hatStyle: string) {
    setActiveCategory(category)
    setActiveSub(sub)
    setActiveBrand(brand)
    setActiveHatStyle(hatStyle)
    // Audience/age group are not selectable from the mega menu yet; reset them
    // so a fresh category selection starts unfiltered.
    setActiveAudience('All')
    setActiveAgeGroup('All')
  }

  // "View All {Type}" link on a category-grouped carousel row header —
  // narrows the current browsing view down to just that product Type,
  // switching from the grouped-rows layout to the flat filterable grid
  // (same behavior as picking a Type pill/dropdown option manually).
  function viewAllType(typeLabel: string) {
    setActiveSub(typeLabel)
  }

  // Persist the exact filtered/sorted product sequence the customer is
  // currently viewing so the product detail page can offer Previous/Next
  // navigation within this same category/filter/sort context, without
  // redirecting back to /shop.
  useEffect(() => {
    if (loading) return
    saveProductListContext(sorted.map((product) => ({ slug: product.slug, name: product.name, imageUrl: product.imageUrl })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, sorted.map((product) => product.slug).join(',')])


  return (
    <>
      <ShopHero
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        liveLabel={s.live}
        livePulse={livePulse}
        initialSlides={initialHeroSlides}
      />

      <StickyShopCategoryNav
        activeCategory={activeCategory}
        onSelect={handleCategoryNavSelect}
        initialCategories={initialCategories}
      />

      <CategoryBanner activeCategory={activeCategory} />

      <div className="mx-auto w-full max-w-none bg-white px-2 pb-8 pt-6 sm:px-3 lg:px-5">
        {activeBrand !== 'All' && (
          <div className="mb-4 flex items-center gap-2.5">
            {activeBrandInfo?.imageUrl ? (
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md bg-white">
                <Image src={activeBrandInfo.imageUrl} alt={activeBrandInfo.name} fill className="object-contain" sizes="28px" />
              </div>
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-jays-navy/10 text-xs font-bold text-jays-navy">
                {(activeBrandInfo?.name ?? activeBrand).charAt(0)}
              </div>
            )}
            <p className="min-w-0 truncate text-sm text-jays-steel">
              Shopping <span className="font-semibold text-jays-navy">{activeBrandInfo?.name ?? activeBrand}</span>
              <span className="hidden text-jays-steel/70 sm:inline"> · {sorted.length} {sorted.length === 1 ? 'product' : 'products'}</span>
            </p>
            <button
              type="button"
              onClick={clearBrand}
              className="ml-auto flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-jays-steel transition-colors hover:text-jays-navy"
            >
              Clear
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {!loading && (
              <p className="text-sm text-jays-steel">
                {hasActiveFilters
                  ? `${sorted.length} ${sorted.length === 1 ? 'item' : 'items'} found`
                  : `${sorted.length} ${sorted.length === 1 ? 'item' : 'items'}`}
              </p>
            )}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-sm text-jays-navy">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-jays-navy focus:ring-jays-navy/40"
              />
              In Stock Only
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span id="shop-sort-label" className="text-xs font-semibold uppercase tracking-wide text-jays-steel">
              Sort by
            </span>
            <Dropdown
              id="shop-sort"
              ariaLabel="Sort products"
              value={sortBy}
              onChange={(v) => setSortBy(v as SortOption)}
              options={SORT_OPTIONS}
              panelClassName="w-64"
            />
          </div>
        </div>

        {activeSub.toLowerCase() === 'hats' && (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <PillRow label="Hat Style" options={availableHatStyles} active={activeHatStyle} onSelect={setActiveHatStyle} />
          </div>
        )}

        {loading ? (
          <div className="mb-12 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl bg-transparent animate-pulse">
                <div className="aspect-[3/4] bg-jays-ice/40" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 rounded bg-gray-100" />
                  <div className="h-3 w-1/2 rounded bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            title={isSearching ? 'No results found' : s.noProducts}
            body={isSearching ? `No products matched "${searchQuery}". Try a different search term.` : s.noProductsBody}
          />
        ) : isGroupedView ? (
          <div className="mb-12 space-y-10">
            {groupedSections.map((group) => (
              <section key={group.key} aria-labelledby={`shop-group-${group.key}`}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2
                    id={`shop-group-${group.key}`}
                    className="font-display text-lg font-bold uppercase tracking-wide text-jays-navy sm:text-xl"
                  >
                    {group.label}
                    <span className="ml-2 text-xs font-medium normal-case tracking-normal text-jays-steel/70">
                      {group.products.length} {group.products.length === 1 ? 'item' : 'items'}
                    </span>
                  </h2>
                  {group.products.length > CAROUSEL_PREVIEW_COUNT && (
                    <button
                      type="button"
                      onClick={() => viewAllType(group.label)}
                      className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-jays-navy transition-colors hover:text-jays-red"
                    >
                      View All
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
                <ProductCarousel
                  products={group.products.slice(0, CAROUSEL_PREVIEW_COUNT)}
                  currentFilters={currentFilters}
                />
              </section>
            ))}
          </div>
        ) : (
          <div className="mb-12 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {sorted.map((product, index) => (
              <Reveal key={product.id} index={index % 12} step={40}>
                <ProductCard
                  product={product}
                  remaining={product.remaining}
                  hasSizes={product.hasSizes}
                  allSizesOos={product.allSizesOos}
                  currentFilters={currentFilters}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </>
  )
}