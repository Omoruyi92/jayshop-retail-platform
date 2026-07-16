export interface ShopFilterState {
  category: string
  sub: string
  brand: string
  search: string
  scrollY: number
  timestamp: number
}

const STORAGE_KEY = 'jays-shop-filter-state'
const TTL_MS = 30 * 60 * 1000 // 30 minutes

export function saveShopState(state: Omit<ShopFilterState, 'timestamp'>): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, timestamp: Date.now() })
    )
  } catch {
    // Silent fail — degrade to stateless navigation (incognito, PWA strict mode, etc.)
  }
}

export function loadShopState(): ShopFilterState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ShopFilterState
    if (Date.now() - parsed.timestamp > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearShopState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function hasShopState(): boolean {
  return loadShopState() !== null
}

// ─────────────────────────────────────────────────────────────────────────
// Product list context — lets the product detail page render "Previous /
// Next" controls that walk through the exact filtered/sorted product list
// the customer was browsing (category, subcategory, brand, search, sort all
// already baked into the ordering) without redirecting back to /shop.
// ─────────────────────────────────────────────────────────────────────────
export interface ProductListContextItem {
  slug: string
  name: string
  imageUrl: string
}

interface ProductListContextPayload {
  items: ProductListContextItem[]
  timestamp: number
}

const LIST_CONTEXT_KEY = 'jays-shop-product-list-context'

export function saveProductListContext(items: ProductListContextItem[]): void {
  try {
    const payload: ProductListContextPayload = { items, timestamp: Date.now() }
    sessionStorage.setItem(LIST_CONTEXT_KEY, JSON.stringify(payload))
  } catch {
    // Silent fail — Prev/Next controls simply won't render.
  }
}

export function loadProductListContext(): ProductListContextItem[] | null {
  try {
    const raw = sessionStorage.getItem(LIST_CONTEXT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ProductListContextPayload
    if (Date.now() - parsed.timestamp > TTL_MS) {
      sessionStorage.removeItem(LIST_CONTEXT_KEY)
      return null
    }
    return parsed.items
  } catch {
    return null
  }
}
