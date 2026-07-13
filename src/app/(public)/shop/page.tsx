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
    <>
      <StickyShopCategoryNav activeCategory={activeCategory} />

      <CategoryBanner activeCategory={activeCategory} />

      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-jays-navy/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-jays-navy">
              <span className="h-1.5 w-1.5 rounded-full bg-jays-navy" />
              Game Day Picks
            </span>
            <h3 className="mt-2 font-display text-2xl font-bold uppercase text-jays-navy sm:text-3xl">Featured Products</h3>
          </div>
        </div>
      </section>

      <ShopPageClient />
    </>
  )
}
