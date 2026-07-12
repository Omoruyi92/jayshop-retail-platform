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
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch { /* ignore */ }
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
