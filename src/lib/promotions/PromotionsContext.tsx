'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface Promotion {
  id: string
  text: string
  link: string | null
  priority: number
}

const PromotionsContext = createContext<Promotion[]>([])

/**
 * Fetches /api/promotions exactly once per page load and shares the result
 * via context. Previously `PromotionBanner`, `Header`, and `PartnerLogosBar`
 * each called their own `usePromotions()`/fetch independently, firing the
 * same request up to 5x per page. Mounted once in the public layout so every
 * consumer reads from the same in-memory state instead of re-fetching.
 */
export function PromotionsProvider({ children }: { children: ReactNode }) {
  const [promotions, setPromotions] = useState<Promotion[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/promotions')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d.promotions)) setPromotions(d.promotions)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return <PromotionsContext.Provider value={promotions}>{children}</PromotionsContext.Provider>
}

export function usePromotions() {
  return useContext(PromotionsContext)
}
