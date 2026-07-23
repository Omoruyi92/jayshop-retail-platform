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
 * Seeded from a server-side Prisma fetch (see `(public)/layout.tsx`) so the
 * correct promotion set — and therefore Header's promo marquee correct
 * final height — is already known on first paint, eliminating the
 * client-only fetch-then-pop-in that was a major CLS contributor. The
 * client-side fetch below only *refreshes* the list after mount (keeps
 * long-lived sessions in sync with newly published/expired promotions) —
 * it no longer gates the initial render.
 *
 * Previously `Header` and `PartnerLogosBar` each called their own
 * `usePromotions()`/fetch independently, firing the same request multiple
 * times per page. Mounted once in the public layout so every consumer
 * reads from the same in-memory state instead of re-fetching.
 */
export function PromotionsProvider({
  children,
  initialPromotions = [],
}: {
  children: ReactNode
  initialPromotions?: Promotion[]
}) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions)

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
