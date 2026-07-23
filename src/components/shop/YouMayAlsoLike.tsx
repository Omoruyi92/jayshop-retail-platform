import { prisma } from '@/lib/prisma'
import ProductCarousel from '@/components/shop/ProductCarousel'

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
  //
  // The whole fetch is wrapped in try/catch: this is an async Server
  // Component rendered directly in the PDP tree with no Suspense/error
  // boundary of its own, so an unhandled throw here (e.g. a transient DB
  // connection-pool hiccup under concurrent cold starts) previously
  // crashed the *entire* PDP RSC render, surfacing as the intermittent
  // "Application error: a server-side exception has occurred" on refresh.
  // "You May Also Like" is a supplementary rail, not core PDP content, so
  // on failure we just render nothing instead of taking down the page.
  let picks: Awaited<ReturnType<typeof prisma.product.findMany>> = []

  try {
    const sameCategory = await prisma.product.findMany({
      where: { id: { not: productId }, status: { not: 'ARCHIVED' }, category },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: MAX_ITEMS,
    })

    picks = sameCategory

    if (picks.length < MAX_ITEMS) {
      const excludeIds = [productId, ...picks.map((p) => p.id)]
      const featured = await prisma.product.findMany({
        where: { id: { notIn: excludeIds }, status: { not: 'ARCHIVED' }, isFeatured: true },
        orderBy: { createdAt: 'desc' },
        take: MAX_ITEMS - picks.length,
      })
      picks = [...picks, ...featured]
    }
  } catch {
    return null
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
      <ProductCarousel products={picks} />
    </section>
  )
}
