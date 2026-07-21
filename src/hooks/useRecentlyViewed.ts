'use client'
import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'jays-shop-recently-viewed'
const MAX_ITEMS = 8

export interface RecentlyViewedItem {
  id: string
  slug: string
  name: string
  imageUrl: string
  priceCents: number
  viewedAt: number
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadAndValidate() {
      let stored: RecentlyViewedItem[] = []
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        stored = raw ? JSON.parse(raw) : []
      } catch {
        stored = []
      }
      if (!stored.length) {
        setItems([])
        return
      }

      // Show cached items immediately, then prune any that no longer exist
      // (deleted/archived products) so we never link to a dead page or show
      // a placeholder image for a product that's gone.
      setItems(stored)

      try {
        const ids = stored.map((i) => i.id).join(',')
        const res = await fetch(`/api/products?ids=${encodeURIComponent(ids)}`)
        if (!res.ok) return
        const data = await res.json()
        const liveIds = new Set((data.products ?? []).map((p: { id: string }) => p.id))
        const valid = stored.filter((i) => liveIds.has(i.id))
        if (cancelled) return
        if (valid.length !== stored.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(valid))
          setItems(valid)
        }
      } catch { /* ignore — keep cached items if validation fails */ }
    }

    loadAndValidate()
    return () => { cancelled = true }
  }, [])

  const addItem = useCallback((product: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let list: RecentlyViewedItem[] = stored ? JSON.parse(stored) : []
      // Remove if already exists
      list = list.filter((item) => item.id !== product.id)
      // Add to front
      list.unshift({ ...product, viewedAt: Date.now() })
      // Trim
      list = list.slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      setItems(list)
    } catch { /* ignore */ }
  }, [])

  return { recentlyViewed: items, addItem }
}
