import ShopPageClient from '@/components/shop/ShopPageClient'
import { prisma } from '@/lib/prisma'

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
  const initialHeroSlides = await prisma.heroSlide
    .findMany({
      where: { scope: 'SHOP', active: true },
      orderBy: { sortOrder: 'asc' },
    })
    .catch(() => [])

  return (
    <ShopPageClient activeCategory={activeCategory} initialHeroSlides={initialHeroSlides} />
  )
}
