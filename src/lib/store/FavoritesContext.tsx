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
const SESSION_KEY = 'jays-shop-session-id'

/** Get or create a stable anonymous session ID (shared identity for a customer's likes) */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

function readCache(): FavoriteItem[] {
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

function writeCache(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* ignore */ }
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  // Seed instantly from the local cache so the UI has something to paint,
  // then immediately reconcile against the database (source of truth) so
  // stale/removed/renamed products never linger in the customer's list and
  // every like/unlike is visible to the admin analytics dashboard.
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setFavorites(readCache())
    setIsHydrated(true)

    const sid = getSessionId()
    if (!sid) return

    fetch(`/api/likes?sessionId=${encodeURIComponent(sid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.favorites)) {
          setFavorites(data.favorites)
          writeCache(data.favorites)
        }
      })
      .catch(() => { /* fall back to cached local state */ })
  }, [])

  const isLiked = useCallback(
    (productId: string) => favorites.some((f) => f.productId === productId),
    [favorites]
  )

  const persist = useCallback((productId: string, wasLiked: boolean, snapshotBefore: FavoriteItem[]) => {
    const sid = getSessionId()
    if (!sid) return

    fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, sessionId: sid }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('like request failed'))))
      .then((data: { liked: boolean }) => {
        // Reconcile in case the server's toggle result disagrees with our
        // optimistic guess (e.g. a duplicate click raced another tab).
        if (data.liked === wasLiked) return
        if (!data.liked) {
          setFavorites((prev) => {
            const next = prev.filter((f) => f.productId !== productId)
            writeCache(next)
            return next
          })
        }
      })
      .catch(() => {
        // Revert the optimistic update on failure
        setFavorites(snapshotBefore)
        writeCache(snapshotBefore)
      })
  }, [])

  const toggle = useCallback((product: FavoriteInput) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.productId === product.productId)
      const next = exists
        ? prev.filter((f) => f.productId !== product.productId)
        : [{ ...product, likedAt: Date.now() }, ...prev]
      writeCache(next)
      persist(product.productId, !exists, prev)
      return next
    })
  }, [persist])

  const remove = useCallback((productId: string) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.productId !== productId)
      writeCache(next)
      // Was liked (present in prev), so removing = unliking server-side.
      if (prev.some((f) => f.productId === productId)) {
        persist(productId, false, prev)
      }
      return next
    })
  }, [persist])

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
