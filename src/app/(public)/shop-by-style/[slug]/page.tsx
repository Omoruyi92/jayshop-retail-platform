import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/shop/ProductCard'
import { getProductAvailability } from '@/lib/inventory/aggregate'

export const revalidate = 60

// NOTE (Phase 4 hand-off): this route (`/shop-by-style/[slug]`) is the link
// target every masonry card on the Shop by Style landing page (`/shop-by-style`)
// points to. This is currently a functional placeholder (simple product grid)
// — Phase 4 owns building out the full filtered listing experience (hero
// media per style, sorting/filtering, etc.) using the same `slug` param and
// the existing `GET /api/styles/[slug]` endpoint.
export default async function StyleDetailPage({ params }: { params: { slug: string } }) {
  const style = await prisma.styleCategory.findFirst({
    where: { slug: params.slug, isActive: true },
  })
  if (!style) notFound()

  const links = await prisma.productStyle.findMany({
    where: { styleCategoryId: style.id },
    orderBy: { sortOrder: 'asc' },
    include: { product: true },
  })
  const products = links.map((l) => l.product).filter((p) => p.status !== 'ARCHIVED')

  const cards = await Promise.all(
    products.map(async (product) => {
      const availability = await getProductAvailability(product.id)
      return { product, availability }
    })
  )

  return (
    <div className="min-h-screen bg-white">
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/shop-by-style" className="text-sm text-jays-steel hover:text-jays-navy">
          Shop by Style
        </Link>
        <span className="text-jays-steel">/</span>
        <span className="text-sm font-semibold text-jays-navy">{style.name}</span>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-jays-navy via-jays-royal to-jays-navy p-6 sm:p-10 mb-8 text-white">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide mb-2">{style.name}</h1>
          {style.description && <p className="text-blue-200 text-sm sm:text-base max-w-xl mb-2">{style.description}</p>}
          <p className="text-blue-200 text-sm sm:text-base">
            {products.length} product{products.length === 1 ? '' : 's'} available
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12 text-jays-steel">No products found for {style.name} yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {cards.map(({ product, availability }) => (
            <ProductCard key={product.id} product={product} remaining={availability.availableBalance} />
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
