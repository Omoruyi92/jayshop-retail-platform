import { prisma } from '@/lib/prisma'

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
