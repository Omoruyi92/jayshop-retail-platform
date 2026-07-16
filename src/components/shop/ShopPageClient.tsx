'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/shop/ProductCard'
import ShopHero from '@/components/shop/ShopHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { BRANDS_BY_CAT, HAT_STYLES } from '@/lib/constants'
import { useCategoryTree } from '@/hooks/useCategoryTree'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { saveShopState, loadShopState, clearShopState, saveProductListContext } from '@/lib/shop/shopState'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  priceCents: number
  imageUrl: string
  category: string
  subcategory: string
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

type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
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
  if (activeCategory === 'All') return true
  if (activeCategory === 'Featured') return product.isFeatured
  if (activeCategory === 'New Arrivals') return product.isNewArrival
  if (activeCategory === 'Sales & Clearance') return product.isClearance || product.salePriceCents > 0
  if (activeCategory === 'Blanks') return product.isBlankJersey
  return product.category.toLowerCase() === activeCategory.toLowerCase()
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

export default function ShopPageClient({ children }: { children?: ReactNode }) {
  const { t } = useLanguage()
  const { subsByCat, subPriorityBySlug } = useCategoryTree()
  const s = t.shop
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeSub, setActiveSub] = useState<string>('All')
  const [activeHatStyle, setActiveHatStyle] = useState<string>('All')
  const [activeBrand, setActiveBrand] = useState<string>('All')
  const [activePriceRange, setActivePriceRange] = useState<string>('All')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('price-asc')
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
    const urlBrand = searchParams?.get('brand')?.trim()
    if (urlCategory === 'All') {
      // Explicit reset request from the "All" pill — always show the full
      // catalog and discard any previously saved filter state.
      clearShopState()
      setActiveCategory('All')
      setActiveSub('All')
      setActiveBrand('All')
      setActiveHatStyle('All')
      setActivePriceRange('All')
      setSearchInput('')
      setSearchQuery('')
      setSortBy('price-asc')
      hasRestoredRef.current = true
      return
    }
    if (saved) {
      setActiveCategory(urlCategory || saved.category)
      setActiveSub(saved.sub)
      setActiveBrand(urlBrand || saved.brand)
      setSearchInput(saved.search)
      setSearchQuery(saved.search)
      pendingScrollRef.current = saved.scrollY
    } else {
      if (urlCategory) setActiveCategory(urlCategory)
      if (urlBrand) setActiveBrand(urlBrand)
    }
    hasRestoredRef.current = true
  }, [searchParams])

  useEffect(() => {
    const urlCategory = searchParams?.get('category')?.trim()
    const urlBrand = searchParams?.get('brand')?.trim()
    if (urlCategory === 'All') {
      setActiveCategory('All')
      setActiveSub('All')
      setActiveBrand('All')
      setActiveHatStyle('All')
      setActivePriceRange('All')
      setSearchInput('')
      setSearchQuery('')
      return
    }
    if (urlBrand) {
      setActiveBrand(urlBrand)
      return
    }
    if (!urlCategory) return
    setActiveCategory(urlCategory)
    setActiveSub('All')
    setActiveBrand('All')
  }, [searchParams])

  useEffect(() => {
    if (!hasRestoredRef.current) return
    saveShopState({
      category: activeCategory,
      sub: activeSub,
      brand: activeBrand,
      search: searchQuery,
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    })
  }, [activeCategory, activeSub, activeBrand, searchQuery])

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
    const interval = setInterval(fetchProducts, 10000)
    return () => clearInterval(interval)
  }, [fetchProducts])

  const isSpecialCategory = SPECIAL_CATEGORIES.has(activeCategory)

  const availableSubs = activeCategory === 'All' || isSpecialCategory
    ? []
    : ['All', ...(subsByCat[activeCategory.toLowerCase()] ?? [])]

  const availableHatStyles = activeSub === 'hats' ? ['All', ...HAT_STYLES] : []

  const catFilteredProducts = products.filter((product) => categoryMatches(product, activeCategory))
  const brandsFromProducts = Array.from(new Set(catFilteredProducts.map((product) => product.brand).filter(Boolean)))
  const predefinedBrands = activeCategory === 'All' || isSpecialCategory ? [] : (BRANDS_BY_CAT[activeCategory.toLowerCase()] ?? [])
  const combinedBrands = Array.from(new Set([...predefinedBrands, ...brandsFromProducts]))
  const availableBrands = activeCategory === 'All' || isSpecialCategory ? [] : ['All', ...combinedBrands]

  const filtered = products.filter((product) => {
    const catMatch = categoryMatches(product, activeCategory)
    const subMatch = isSpecialCategory || activeSub === 'All' || product.subcategory.toLowerCase() === activeSub.toLowerCase()
    const hatStyleMatch = activeSub !== 'hats' || activeHatStyle === 'All' || (product.hatStyle ?? '') === activeHatStyle
    const brandMatch = isSpecialCategory || activeBrand === 'All' || product.brand === activeBrand

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
        product.subcategory.toLowerCase().includes(query)
    }

    return catMatch && subMatch && hatStyleMatch && brandMatch && priceMatch && stockMatch && searchMatch
  })

  // Default merchandising order (Jerseys -> Hats -> Fleece -> Accessories,
  // per Category.sortPriority) only applies to the unfiltered "All" catalog
  // view while the sort dropdown is at its default (Price: Low to High).
  // Any explicit category/subcategory/brand pill, or an explicit sort
  // selection, drops straight into plain price/name sorting so filtered
  // views "just work" without surprise reordering.
  const useMerchandisingOrder = activeCategory === 'All' && sortBy === 'price-asc'

  const sorted = [...filtered].sort((a, b) => {
    if (useMerchandisingOrder) {
      const FALLBACK_PRIORITY = 999
      const priorityA = subPriorityBySlug[a.subcategory.toLowerCase()] ?? FALLBACK_PRIORITY
      const priorityB = subPriorityBySlug[b.subcategory.toLowerCase()] ?? FALLBACK_PRIORITY
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
    isSearching || activeCategory !== 'All' || activeSub !== 'All' || activeHatStyle !== 'All' || activeBrand !== 'All' || activePriceRange !== 'All' || inStockOnly

  const currentFilters = {
    category: activeCategory,
    sub: activeSub,
    brand: activeBrand,
    search: searchInput,
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
      />

      {children}

      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
          <PillRow
            label="Subcategory"
            options={availableSubs}
            active={activeSub}
            onSelect={(value) => {
              setActiveSub(value)
              setActiveBrand('All')
              setActiveHatStyle('All')
            }}
            formatLabel={(sub) =>
              sub === 'All'
                ? (activeCategory === 'Kids' ? 'All Kids' : s.allSubcategories)
                : sub.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('-')
            }
          />

          {activeSub === 'hats' && (
            <PillRow
              label="Hat Style"
              options={availableHatStyles}
              active={activeHatStyle}
              onSelect={setActiveHatStyle}
              formatLabel={(style) => (style === 'All' ? 'All Styles' : style)}
            />
          )}

          <PillRow
            label="Brand"
            options={availableBrands}
            active={activeBrand}
            onSelect={setActiveBrand}
            formatLabel={(brand) => (brand === 'All' ? 'All Brands' : brand)}
          />

          <PillRow
            label="Price"
            options={PRICE_RANGES.map((r) => r.value)}
            active={activePriceRange}
            onSelect={setActivePriceRange}
            formatLabel={(value) => PRICE_RANGES.find((r) => r.value === value)?.label ?? value}
          />
        </div>

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

        {loading ? (
          <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm animate-pulse">
                <div className="aspect-[3/4] bg-jays-ice" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
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
          <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
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