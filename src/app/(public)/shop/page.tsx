import StickyShopCategoryNav from '@/components/shop/StickyShopCategoryNav'
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

      <section className="border-b border-jays-royal/40 bg-jays-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-200/70">The Fanatic Experience</p>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">THE DUGOUT</h2>
            <p className="mt-1 max-w-2xl text-sm text-blue-100/80">
              Curated game-day drops, premium essentials, and featured Blue Jays merchandise.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-blue-100/75">
            <span className="rounded-full bg-white/10 px-3 py-1">Featured</span>
            <span className="rounded-full bg-white/10 px-3 py-1">New Arrivals</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Sales &amp; Clearance</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-jays-steel">Game Day Picks</p>
            <h3 className="font-display text-2xl font-bold uppercase text-jays-navy">FEATURED PRODUCTS</h3>
          </div>
        </div>
      </section>

      <ShopPageClient />
    </>
  )
}
