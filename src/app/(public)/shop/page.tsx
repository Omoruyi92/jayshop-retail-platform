import ShopPageClient from '@/components/shop/ShopPageClient'

export default function ShopPage({
  searchParams,
}: {
  searchParams?: { category?: string; sub?: string; brand?: string; hatStyle?: string }
}) {
  const activeCategory = typeof searchParams?.category === 'string' ? searchParams.category : 'All'

  return (
    <ShopPageClient activeCategory={activeCategory} />
  )
}
