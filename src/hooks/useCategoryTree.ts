'use client'
import { useEffect, useState } from 'react'
import { MAIN_CATEGORIES as STATIC_MAIN, SUBS_BY_CAT as STATIC_SUBS } from '@/lib/constants'

export interface CategoryNode {
  id: string
  name: string
  slug: string
  isActive: boolean
  sortOrder: number
  sortPriority: number | null
  children: CategoryNode[]
}

/**
 * Fetches the live category tree from the database (via the public
 * /api/categories endpoint) so admin forms and shop filters reflect
 * whatever an admin has configured at /admin/categories. Falls back to
 * the static constants while loading or if the request fails, so the UI
 * never renders empty dropdowns.
 */
export function useCategoryTree() {
  const [categories, setCategories] = useState<CategoryNode[] | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => { if (active) setCategories(data.categories ?? []) })
      .catch(() => { if (active) setCategories(null) })
    return () => { active = false }
  }, [])

  const mainCategories: string[] = categories?.length
    ? categories.map((c) => c.slug)
    : [...STATIC_MAIN]

  const subsByCat: Record<string, string[]> = categories?.length
    ? Object.fromEntries(categories.map((c) => [c.slug, c.children.map((s) => s.slug)]))
    : STATIC_SUBS

  const labelsBySlug: Record<string, string> = categories?.length
    ? Object.fromEntries([
        ...categories.map((c) => [c.slug, c.name]),
        ...categories.flatMap((c) => c.children.map((s) => [s.slug, s.name])),
      ])
    : {}

  // Merchandising priority per subcategory slug (e.g. jerseys=1, hats=2,
  // fleece=3, accessories=4), sourced from Category.sortPriority so admins
  // can tune the default Shop catalog ordering without a code change. When
  // the same slug appears under multiple parent categories, the lowest
  // (highest-priority) value wins. Slugs with no priority set are omitted
  // here and fall back to "sort last" wherever this map is consumed.
  const subPriorityBySlug: Record<string, number> = {}
  if (categories?.length) {
    for (const cat of categories) {
      for (const sub of cat.children) {
        if (typeof sub.sortPriority !== 'number') continue
        const existing = subPriorityBySlug[sub.slug]
        if (existing === undefined || sub.sortPriority < existing) {
          subPriorityBySlug[sub.slug] = sub.sortPriority
        }
      }
    }
  }

  return {
    categories: categories ?? [],
    mainCategories,
    subsByCat,
    labelsBySlug,
    subPriorityBySlug,
    loading: categories === null,
  }
}
