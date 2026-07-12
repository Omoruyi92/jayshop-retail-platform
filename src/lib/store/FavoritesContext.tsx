'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

export interface FavoriteInput {
  productId: string
  slug: string
  name: string
  imageUrl: string
  priceCents: number
}

export interface FavoriteItem extends FavoriteInput {
  likedAt: number
}

interface FavoritesContextValue {
  favorites: FavoriteItem[]
  count: number
  isLiked: (productId: string) => boolean
  toggle: (product: FavoriteInput) => void
  remove: (productId: string) => void
  isHydrated: boolean
}

const STORAGE_KEY = 'jays-favorites'

function readStorage(): FavoriteItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStorage(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* ignore */ }
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setFavorites(readStorage())
    setIsHydrated(true)

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(readStorage())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    writeStorage(favorites)
  }, [favorites, isHydrated])

  const isLiked = useCallback(
    (productId: string) => favorites.some((f) => f.productId === productId),
    [favorites]
  )

  const toggle = useCallback((product: FavoriteInput) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.productId === product.productId)
      if (exists) {
        return prev.filter((f) => f.productId !== product.productId)
      }
      return [{ ...product, likedAt: Date.now() }, ...prev]
    })
  }, [])

  const remove = useCallback((productId: string) => {
    setFavorites((prev) => prev.filter((f) => f.productId !== productId))
  }, [])

  const value: FavoritesContextValue = {
    favorites,
    count: favorites.length,
    isLiked,
    toggle,
    remove,
    isHydrated,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = Object.assign(
  function useFavorites(): FavoritesContextValue {
    const ctx = useContext(FavoritesContext)
    if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
    return ctx
  },
  { displayName: 'useFavorites' }
)
