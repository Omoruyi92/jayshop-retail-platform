'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import ProductCard from '@/components/shop/ProductCard'
import SearchBar from '@/components/shop/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SUBS_BY_CAT, BRANDS_BY_CAT, KIDS_SIZE_MAP } from '@/lib/constants'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { saveShopState, loadShopState } from '@/lib/shop/shopState'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  priceCents: number
  imageUrl: string
  category: string
  subcategory: string
  quantity: number
  heldQuantity: number
  pickedQuantity: number
  sizes: string
  brand: string
  status: string
  isLicensed: boolean
  isChampion: boolean
  createdAt: Date
  updatedAt: Date
  remaining: number
  hasSizes?: boolean
  allSizesOos?: boolean
}

const CATEGORY_KEYS = ['All', 'Men', 'Women', 'Kids', 'Accessories'] as const

const selectCls =
  'bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-jays-navy focus:border-transparent cursor-pointer w-full'

export default function ShopPage() {
  const { t } = useLanguage()
  const s = t.shop

  const [products, setProducts]             = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeSub, setActiveSub]           = useState<string>('All')
  const [activeBrand, setActiveBrand]       = useState<string>('All')
  const [loading, setLoading]               = useState(true)
  const [livePulse, setLivePulse]           = useState(false)
  const [searchInput, setSearchInput]       = useState('')
  const [searchQuery, setSearchQuery]       = useState('')
  const prevCountRef                        = useRef<number>(0)
  const debounceRef                         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulseTimerRef                       = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Navigation state restoration refs
  const hasRestoredRef   = useRef(false)  // blocks premature saves during initial hydration
  const pendingScrollRef = useRef<number | null>(null)  // scroll target waiting for products to load

  // ── Phase 1: Hydrate filter/scroll state from sessionStorage on mount ──────
  useEffect(() => {
    const saved = loadShopState()
    if (saved) {
      setActiveCategory(saved.category)
      setActiveSub(saved.sub)
      setActiveBrand(saved.brand)
      setSearchInput(saved.search)
      setSearchQuery(saved.search)
      pendingScrollRef.current = saved.scrollY
    }
    hasRestoredRef.current = true
  }, [])

  // ── Phase 2: Persist filter state on every change (skip initial hydration) ─
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

  // ── Phase 3: Restore scroll after products finish loading ─────────────────
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
      const res  = await fetch('/api/products')
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
      // silently fail on poll
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    const interval = setInterval(fetchProducts, 10000)
    return () => clearInterval(interval)
  }, [fetchProducts])

  const availableSubs = activeCategory === 'All'
    ? []
    : ['All', ...(SUBS_BY_CAT[activeCategory.toLowerCase()] ?? [])]

  const catFilteredProducts = products.filter((p) =>
    activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase()
  )
  const brandsFromProducts = Array.from(new Set(catFilteredProducts.map((p) => p.brand).filter(Boolean)))
  const predefinedBrands = activeCategory === 'All' ? [] : (BRANDS_BY_CAT[activeCategory.toLowerCase()] ?? [])
  const combinedBrands = Array.from(new Set([...predefinedBrands, ...brandsFromProducts]))
  const availableBrands = activeCategory === 'All' ? [] : ['All', ...combinedBrands]

  const filtered = products.filter((p) => {
    const catMatch   = activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase()
    const subMatch   = activeSub === 'All'      || p.subcategory.toLowerCase() === activeSub.toLowerCase()
    const brandMatch = activeBrand === 'All'    || p.brand === activeBrand

    let searchMatch = true
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      searchMatch =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q)
    }

    return catMatch && subMatch && brandMatch && searchMatch
  })

  const isSearching = searchQuery.trim().length > 0

  // Current filters passed to ProductCard so it can save state before navigating
  const currentFilters = {
    category: activeCategory,
    sub: activeSub,
    brand: activeBrand,
    search: searchInput,
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase text-jays-navy">
            {s.title}
          </h1>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity duration-500 ${livePulse ? 'opacity-100' : 'opacity-0'} bg-green-100 text-green-700`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            {s.live}
          </span>
        </div>
        <p className="text-jays-steel">{s.subtitle}</p>
      </div>

      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-jays-ice/80 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-4 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0 sm:py-0 sm:mb-4">
        <SearchBar value={searchInput} onChange={handleSearchChange} />
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 mb-4">
        {/* Category */}
        <select
          value={activeCategory}
          onChange={(e) => {
            setActiveCategory(e.target.value)
            setActiveSub('All')
            setActiveBrand('All')
          }}
          className={selectCls}
          aria-label="Filter by category"
        >
          {CATEGORY_KEYS.map((cat) => (
            <option key={cat} value={cat}>
              {s.categories[cat]}
            </option>
          ))}
        </select>

        {/* Subcategory */}
        <select
          value={activeSub}
          onChange={(e) => { setActiveSub(e.target.value); setActiveBrand('All') }}
          disabled={availableSubs.length === 0}
          className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label="Filter by subcategory"
        >
          {availableSubs.length === 0 ? (
            <option value="All">{s.allSubcategories}</option>
          ) : (
            availableSubs.map((sub) => (
              <option key={sub} value={sub}>
                {sub === 'All'
                  ? (activeCategory === 'Kids' ? 'All Kids' : s.allSubcategories)
                  : sub.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
              </option>
            ))
          )}
        </select>

        {/* Brand */}
        <select
          value={activeBrand}
          onChange={(e) => setActiveBrand(e.target.value)}
          disabled={availableBrands.length === 0}
          className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label="Filter by brand"
        >
          {availableBrands.length === 0 ? (
            <option value="All">All Brands</option>
          ) : (
            availableBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand === 'All' ? 'All Brands' : brand}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-sm text-jays-steel mb-4">
          {isSearching || activeCategory !== 'All' || activeSub !== 'All' || activeBrand !== 'All'
            ? `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'} found`
            : `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border shadow-sm animate-pulse overflow-hidden">
              <div className="aspect-[3/4] bg-jays-ice" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={isSearching ? 'No results found' : s.noProducts}
          body={isSearching ? `No products matched "${searchQuery}". Try a different search term.` : s.noProductsBody}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {filtered.map((product) => (
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
  )
}
