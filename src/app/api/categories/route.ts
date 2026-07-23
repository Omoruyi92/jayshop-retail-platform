import { NextResponse } from 'next/server'
import { getCategoryTree } from '@/lib/categories'

export const dynamic = 'force-dynamic'

// Public: returns active categories with their active subcategories,
// ordered for storefront display. Consumed by the shop filters,
// category navigation, and admin product forms. Shares its query/shaping
// logic with `getCategoryTree` (used server-side by the Shop page to seed
// `StickyShopCategoryNav` on first paint) so both stay in sync.
export async function GET() {
  const categories = await getCategoryTree()
  return NextResponse.json({ categories })
}
