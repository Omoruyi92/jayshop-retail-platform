import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/shop/ProductCard'

const MAX_ITEMS = 8

export default async function YouMayAlsoLike({
  productId,
  category,
}: {
  productId: string
  category: string
}) {
  // Prioritize other products in the same category, then top up with
  // featured products so the "You May Also Like" rail always has content
  // even for categories with few items.
  const sameCategory = await prisma.product.findMany({
    where: { id: { not: productId }, status: { not: 'ARCHIVED' }, category },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take: MAX_ITEMS,
  })

  let picks = sameCategory

  if (picks.length < MAX_ITEMS) {
    const excludeIds = [productId, ...picks.map((p) => p.id)]
    const featured = await prisma.product.findMany({
      where: { id: { notIn: excludeIds }, status: { not: 'ARCHIVED' }, isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: MAX_ITEMS - picks.length,
    })
    picks = [...picks, ...featured]
  }

  if (picks.length === 0) return null

  return (
    <section aria-labelledby="you-may-also-like-title">
      <h2
        id="you-may-also-like-title"
        className="font-display text-xl sm:text-2xl font-bold uppercase text-jays-navy mb-5"
      >
        You May Also Like
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {picks.map((product) => {
          const remaining = Math.max(0, product.quantity - product.heldQuantity)
          return (
            <ProductCard
              key={product.id}
              product={product}
              remaining={remaining}
            />
          )
        })}
      </div>
    </section>
  )
}
