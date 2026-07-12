'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

export interface CartLine {
  productId: string
  slug: string
  name: string
  imageUrl: string
  priceCents: number
  size?: string
  quantity: number
  addedAt: number
}

interface CartContextValue {
  items: CartLine[]
  count: number
  totalCents: number
  addItem: (line: Omit<CartLine, 'addedAt' | 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string, size?: string) => void
  updateQuantity: (productId: string, quantity: number, size?: string) => void
  clearCart: () => void
  isHydrated: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'jays-cart'

function readStorage(): CartLine[] {
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

function writeStorage(items: CartLine[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch { /* ignore */ }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setItems(readStorage())
    setIsHydrated(true)

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setItems(readStorage())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    writeStorage(items)
  }, [items, isHydrated])

  const addItem = useCallback((line: Omit<CartLine, 'addedAt' | 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === line.productId && i.size === line.size
      )
      const quantity = Math.max(1, line.quantity ?? 1)
      if (existingIndex >= 0) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        }
        return next
      }
      return [{ ...line, quantity, addedAt: Date.now() }, ...prev]
    })
  }, [])

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.size === size))
    )
  }, [])

  const updateQuantity = useCallback(
    (productId: string, quantity: number, size?: string) => {
      setItems((prev) =>
        prev
          .map((i) => {
            if (i.productId === productId && i.size === size) {
              return { ...i, quantity: Math.max(0, quantity) }
            }
            return i
          })
          .filter((i) => i.quantity > 0)
      )
    },
    []
  )

  const clearCart = useCallback(() => setItems([]), [])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalCents = items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        totalCents,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
