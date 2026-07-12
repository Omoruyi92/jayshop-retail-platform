'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/shop/ProductCard'
import SearchBar from '@/components/shop/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SUBS_BY_CAT, BRANDS_BY_CAT } from '@/lib/constants'
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

export default function ShopPageClient() {
  const { t } = useLanguage()
  const s = t.shop
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeSub, setActiveSub] = useState<string>('All')
  const [activeBrand, setActiveBrand] = useState<string>('All')
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
    if (saved) {
      setActiveCategory(urlCategory || saved.category)
      setActiveSub(saved.sub)
      setActiveBrand(saved.brand)
      setSearchInput(saved.search)
      setSearchQuery(saved.search)
      pendingScrollRef.current = saved.scrollY
    } else if (urlCategory) {
      setActiveCategory(urlCategory)
    }
    hasRestoredRef.current = true
  }, [searchParams])

  useEffect(() => {
    const urlCategory = searchParams?.get('category')?.trim()
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

  const availableSubs = activeCategory === 'All'
    ? []
    : ['All', ...(SUBS_BY_CAT[activeCategory.toLowerCase()] ?? [])]

  const catFilteredProducts = products.filter((product) =>
    activeCategory === 'All' || product.category.toLowerCase() === activeCategory.toLowerCase()
  )
  const brandsFromProducts = Array.from(new Set(catFilteredProducts.map((product) => product.brand).filter(Boolean)))
  const predefinedBrands = activeCategory === 'All' ? [] : (BRANDS_BY_CAT[activeCategory.toLowerCase()] ?? [])
  const combinedBrands = Array.from(new Set([...predefinedBrands, ...brandsFromProducts]))
  const availableBrands = activeCategory === 'All' ? [] : ['All', ...combinedBrands]

  const filtered = products.filter((product) => {
    const catMatch = activeCategory === 'All' || product.category.toLowerCase() === activeCategory.toLowerCase()
    const subMatch = activeSub === 'All' || product.subcategory.toLowerCase() === activeSub.toLowerCase()
    const brandMatch = activeBrand === 'All' || product.brand === activeBrand

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

    return catMatch && subMatch && brandMatch && searchMatch
  })

  const isSearching = searchQuery.trim().length > 0

  const currentFilters = {
    category: activeCategory,
    sub: activeSub,
    brand: activeBrand,
    search: searchInput,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold uppercase text-jays-navy sm:text-4xl">
            {s.title}
          </h1>
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 transition-opacity duration-500 ${livePulse ? 'opacity-100' : 'opacity-0'}`}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {s.live}
          </span>
        </div>
        <p className="text-jays-steel">{s.subtitle}</p>
      </div>

      <div className="-mx-4 mb-4 sticky top-0 z-10 bg-jays-ice/80 px-4 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <SearchBar value={searchInput} onChange={handleSearchChange} />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <select
          value={activeCategory}
          onChange={(event) => {
            setActiveCategory(event.target.value)
            setActiveSub('All')
            setActiveBrand('All')
          }}
          className={selectCls}
          aria-label="Filter by category"
        >
          {CATEGORY_KEYS.map((category) => (
            <option key={category} value={category}>
              {s.categories[category]}
            </option>
          ))}
        </select>

        <select
          value={activeSub}
          onChange={(event) => {
            setActiveSub(event.target.value)
            setActiveBrand('All')
          }}
          disabled={availableSubs.length === 0}
          className={`${selectCls} disabled:cursor-not-allowed disabled:opacity-40`}
          aria-label="Filter by subcategory"
        >
          {availableSubs.length === 0 ? (
            <option value="All">{s.allSubcategories}</option>
          ) : (
            availableSubs.map((sub) => (
              <option key={sub} value={sub}>
                {sub === 'All'
                  ? (activeCategory === 'Kids' ? 'All Kids' : s.allSubcategories)
                  : sub.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('-')}
              </option>
            ))
          )}
        </select>

        <select
          value={activeBrand}
          onChange={(event) => setActiveBrand(event.target.value)}
          disabled={availableBrands.length === 0}
          className={`${selectCls} disabled:cursor-not-allowed disabled:opacity-40`}
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

      {!loading && (
        <p className="mb-4 text-sm text-jays-steel">
          {isSearching || activeCategory !== 'All' || activeSub !== 'All' || activeBrand !== 'All'
            ? `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'} found`
            : `${filtered.length} ${filtered.length === 1 ? 'item' : 'items'}`}
        </p>
      )}

      {loading ? (
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
      ) : filtered.length === 0 ? (
        <EmptyState
          title={isSearching ? 'No results found' : s.noProducts}
          body={isSearching ? `No products matched "${searchQuery}". Try a different search term.` : s.noProductsBody}
        />
      ) : (
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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