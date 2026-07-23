'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  MAIN_CATEGORIES as STATIC_MAIN,
  SUBS_BY_CAT as STATIC_SUBS,
  PRODUCT_TYPES_BY_CAT as STATIC_PRODUCT_TYPES,
  BRANDS_BY_CAT as STATIC_BRANDS,
} from '@/lib/constants'

export interface CategoryChild {
  id: string
  name: string
  slug: string
  parentId: string | null
  isActive: boolean
  sortOrder: number
  sortPriority: number | null
}

export interface CategoryNode {
  id: string
  name: string
  slug: string
  isActive: boolean
  sortOrder: number
  sortPriority: number | null
  children: CategoryChild[]
  productTypes?: { name: string; slug: string }[]
  brands?: { name: string; slug: string; imageUrl: string }[]
}

/**
 * Fetches the live category tree from the database (via the public
 * /api/categories endpoint) so admin forms and shop filters reflect
 * whatever an admin has configured at /admin/categories. Falls back to
 * the static constants while loading or if the request fails, so the UI
 * never renders empty dropdowns.
 *
 * Accepts an optional `initialCategories` (e.g. fetched server-side via
 * `getCategoryTree` and passed down as a prop) to seed state so the hook
 * starts in the "loaded" state on first render instead of `null` —
 * eliminating the client-only loading window entirely for callers that can
 * provide it (see `ShopPageClient`/`StickyShopCategoryNav`). A background
 * fetch still runs afterward so data stays fresh if it changes admin-side
 * after the page was rendered/cached. Callers with no SSR data available
 * (e.g. `EditProductModal`) simply omit the argument and get the previous,
 * client-only-fetch behavior unchanged.
 */
export function useCategoryTree(initialCategories?: CategoryNode[]) {
  const [categories, setCategories] = useState<CategoryNode[] | null>(
    initialCategories && initialCategories.length ? initialCategories : null
  )

  useEffect(() => {
    let active = true
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => { if (active) setCategories(data.categories ?? []) })
      .catch(() => { if (active) setCategories((prev) => prev ?? null) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mainCategories: string[] = useMemo(
    () => (categories?.length ? categories.map((c) => c.slug) : [...STATIC_MAIN]),
    [categories]
  )

  const subsByCat: Record<string, string[]> = useMemo(
    () =>
      categories?.length
        ? Object.fromEntries(categories.map((c) => [c.slug, c.children.map((s) => s.slug)]))
        : STATIC_SUBS,
    [categories]
  )

  const labelsBySlug: Record<string, string> = useMemo(
    () =>
      categories?.length
        ? Object.fromEntries([
            ...categories.map((c) => [c.slug, c.name]),
            ...categories.flatMap((c) => c.children.map((s) => [s.slug, s.name])),
          ])
        : {},
    [categories]
  )

  // Merchandising priority per subcategory slug (e.g. jerseys=1, hats=2,
  // fleece=3, accessories=4), sourced from Category.sortPriority so admins
  // can tune the default Shop catalog ordering without a code change. When
  // the same slug appears under multiple parent categories, the lowest
  // (highest-priority) value wins. Slugs with no priority set are omitted
  // here and fall back to "sort last" wherever this map is consumed.
  const subPriorityBySlug: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {}
    if (categories?.length) {
      for (const cat of categories) {
        for (const sub of cat.children) {
          if (typeof sub.sortPriority !== 'number') continue
          const existing = map[sub.slug]
          if (existing === undefined || sub.sortPriority < existing) {
            map[sub.slug] = sub.sortPriority
          }
        }
      }
    }
    return map
  }, [categories])

  // Type ("Jerseys", "Fleece", ...) and Brand options per top-level
  // category slug, sourced from admin-managed CategoryProductType /
  // CategoryBrand records. Falls back to the static constants per-key
  // while loading or when a category has zero configured rows (e.g.
  // Featured / Sales & Clearance, which aren't real Category rows).
  const productTypesBySlug: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = { ...STATIC_PRODUCT_TYPES }
    if (categories?.length) {
      for (const cat of categories) {
        if (cat.productTypes && cat.productTypes.length > 0) {
          map[cat.slug] = cat.productTypes.map((pt) => pt.name)
        }
      }
    }
    return map
  }, [categories])

  const brandsBySlug: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = { ...STATIC_BRANDS }
    if (categories?.length) {
      for (const cat of categories) {
        if (cat.brands && cat.brands.length > 0) {
          map[cat.slug] = cat.brands.map((b) => b.name)
        }
      }
    }
    return map
  }, [categories])

  return {
    categories: categories ?? [],
    mainCategories,
    subsByCat,
    labelsBySlug,
    subPriorityBySlug,
    productTypesBySlug,
    brandsBySlug,
    loading: categories === null,
  }
}
