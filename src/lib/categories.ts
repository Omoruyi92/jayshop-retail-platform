import { prisma } from '@/lib/prisma'
import type { CategoryNode } from '@/hooks/useCategoryTree'

/**
 * Server-side fetch of the same category tree shape returned by
 * `/api/categories`, used by server components (e.g. the Shop page) so the
 * correct, final category pill list is known on first paint — avoiding the
 * client-only loading state in `useCategoryTree` (full static fallback list
 * shown, then narrowed once the client fetch resolves) that previously
 * caused a layout shift in `StickyShopCategoryNav`. Swallows errors and
 * returns an empty array so a failed query never breaks the page itself
 * (the hook falls back to its static constants in that case, same as
 * before this SSR path existed).
 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        productTypes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        categoryBrands: {
          orderBy: { sortOrder: 'asc' },
          include: { brand: true },
        },
      },
    })

    return categories.map((c) => ({
      ...c,
      children: c.children.map((sub) => ({ ...sub, children: [] })),
      productTypes: c.productTypes.map((pt) => ({ name: pt.name, slug: pt.slug })),
      brands: c.categoryBrands
        .filter((cb) => cb.brand.status === 'ACTIVE')
        .map((cb) => ({ name: cb.brand.name, slug: cb.brand.slug, imageUrl: cb.brand.imageUrl })),
    }))
  } catch {
    return []
  }
}

/**
 * Server-side equivalent of the merchandising priority map computed by
 * `useCategoryTree`'s `subPriorityBySlug` (client-side, via /api/categories).
 * Used by server components that need to order category/product-type
 * carousel sections (e.g. the brand detail page) without a client fetch
 * round-trip. Sourced from the same `Category.sortPriority` field, so
 * ordering stays consistent with the Shop catalog's default arrangement.
 * When the same subcategory slug appears under multiple parent categories,
 * the lowest (highest-priority) value wins. Slugs with no priority set are
 * omitted; callers should fall back to "sort last" for those.
 */
export async function getSubPriorityMap(): Promise<Record<string, number>> {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    include: {
      children: {
        where: { isActive: true },
        select: { slug: true, sortPriority: true },
      },
    },
  })

  const map: Record<string, number> = {}
  for (const cat of categories) {
    for (const sub of cat.children) {
      if (typeof sub.sortPriority !== 'number') continue
      const existing = map[sub.slug]
      if (existing === undefined || sub.sortPriority < existing) {
        map[sub.slug] = sub.sortPriority
      }
    }
  }
  return map
}
