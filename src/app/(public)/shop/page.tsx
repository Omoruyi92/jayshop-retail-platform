import StickyShopCategoryNav from '@/components/shop/StickyShopCategoryNav'
import CategoryBanner from '@/components/shop/CategoryBanner'
import ShopPageClient from '@/components/shop/ShopPageClient'

export default function ShopPage({
  searchParams,
}: {
  searchParams?: { category?: string }
}) {
  const activeCategory = typeof searchParams?.category === 'string' ? searchParams.category : 'All'

  return (
    <ShopPageClient>
      <StickyShopCategoryNav activeCategory={activeCategory} />
      <CategoryBanner activeCategory={activeCategory} />
    </ShopPageClient>
  )
}
