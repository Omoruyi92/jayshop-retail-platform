'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/shop/ProductCard'
import ShopHero from '@/components/shop/ShopHero'
import type { Slide as HeroSlide } from '@/components/shop/HeroSlideshow'
import StickyShopCategoryNav from '@/components/shop/StickyShopCategoryNav'
import CategoryBanner from '@/components/shop/CategoryBanner'
import { EmptyState } from '@/components/ui/EmptyState'
import { HAT_STYLES, categoryHasAudience, categoryHasAgeGroup, AUDIENCES, KIDS_AGE_GROUPS } from '@/lib/constants'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { saveShopState, loadShopState, clearShopState, saveProductListContext } from '@/lib/shop/shopState'
import { useInventoryStream } from '@/hooks/useInventoryStream'

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
  salePriceCents: number
  createdAt: Date
  updatedAt: Date
  remaining: number
  hasSizes?: boolean
  allSizesOos?: boolean
}

const SPECIAL_CATEGORIES = new Set(['Featured', 'New Arrivals', 'Sales & Clearance', 'Blanks'])

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

function FilterSelect({
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
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-jays-steel/70">
        {label}
      </label>
      <select
        value={options.find((o) => o.toLowerCase() === active.toLowerCase()) ?? active}
        onChange={(e) => onSelect(e.target.value)}
        className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-display font-semibold uppercase tracking-wide text-jays-navy shadow-sm focus:border-jays-navy/40 focus:outline-none focus:ring-2 focus:ring-jays-navy/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel ? formatLabel(option) : option}
          </option>
        ))}
      </select>
    </div>
  )
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
}: {
  activeCategory: string
  initialHeroSlides?: HeroSlide[]
}) {
  const { t } = useLanguage()
  const { subsByCat, subPriorityBySlug, productTypesBySlug, brandsBySlug } = useCategoryTree()
  const s = t.shop
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
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
      // catalog and discard any previously saved filter state.
      clearShopState()
      setActiveCategory('All')
      setActiveSub('All')
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
    if (saved) {
      setActiveCategory(urlCategory || saved.category)
      setActiveSub(urlSub || saved.sub)
      setActiveAudience(urlAudience || saved.audience || 'All')
      setActiveAgeGroup(urlAgeGroup || saved.ageGroup || 'All')
      setActiveBrand(urlBrand || saved.brand)
      setActiveHatStyle(urlHatStyle || saved.hatStyle || 'All')
      setSearchInput(saved.search)
      setSearchQuery(saved.search)
      pendingScrollRef.current = saved.scrollY
    } else {
      if (urlCategory) setActiveCategory(urlCategory)
      if (urlSub) setActiveSub(urlSub)
      if (urlAudience) setActiveAudience(urlAudience)
      if (urlAgeGroup) setActiveAgeGroup(urlAgeGroup)
      if (urlBrand) setActiveBrand(urlBrand)
      if (urlHatStyle) setActiveHatStyle(urlHatStyle)
    }
    hasRestoredRef.current = true
  }, [searchParams])

  useEffect(() => {
    const urlCategory = searchParams?.get('category')?.trim()
    const urlSub = searchParams?.get('sub')?.trim()
    const urlAudience = searchParams?.get('audience')?.trim()
    const urlAgeGroup = searchParams?.get('ageGroup')?.trim()
    const urlBrand = searchParams?.get('brand')?.trim()
    const urlHatStyle = searchParams?.get('hatStyle')?.trim()
    if (urlCategory === 'All') {
      setActiveCategory('All')
      setActiveSub('All')
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

  const currentFilters = {
    category: activeCategory,
    sub: activeSub,
    audience: activeAudience,
    ageGroup: activeAgeGroup,
    brand: activeBrand,
    hatStyle: activeHatStyle,
    search: searchInput,
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

      <StickyShopCategoryNav activeCategory={activeCategory} onSelect={handleCategoryNavSelect} />
      <CategoryBanner activeCategory={activeCategory} />

      <div className="mx-auto w-full max-w-none bg-white px-3 pb-8 pt-6 sm:px-4 lg:px-8">
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
            <label htmlFor="shop-sort" className="text-xs font-semibold uppercase tracking-wide text-jays-steel">
              Sort by
            </label>
            <select
              id="shop-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-jays-navy shadow-sm focus:border-jays-navy/40 focus:outline-none focus:ring-2 focus:ring-jays-navy/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
        ) : (
          <div className="mb-12 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {sorted.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                remaining={product.remaining}
                hasSizes={product.hasSizes}
                allSizesOos={product.allSizesOos}
                currentFilters={currentFilters}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}