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
