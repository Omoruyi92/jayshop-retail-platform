import ShopPageClient from '@/components/shop/ShopPageClient'
import { getHeroSlides } from '@/lib/hero/getHeroSlides'
import { getCategoryTree } from '@/lib/categories'

export const dynamic = 'force-dynamic'

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: { category?: string; sub?: string; brand?: string; hatStyle?: string }
}) {
  const activeCategory = typeof searchParams?.category === 'string' ? searchParams.category : 'All'

  // Fetch active SHOP hero slides on the server so the correct hero media
  // (or the default fallback banner, when none are configured) is present in
  // the very first render — avoiding a flash of the default background
  // before the client-side slideshow fetch would otherwise resolve.
  const initialHeroSlides = await getHeroSlides('SHOP')

  // Fetch the category tree on the server too, so StickyShopCategoryNav's
  // final pill list/width is known on first paint instead of rendering the
  // full static fallback list and shrinking once the client-side
  // /api/categories fetch resolves (was a CLS source, see root cause D in
  // cls-audit-findings.md).
  const initialCategories = await getCategoryTree()

  return (
    <ShopPageClient
      activeCategory={activeCategory}
      initialHeroSlides={initialHeroSlides}
      initialCategories={initialCategories}
    />
  )
}
