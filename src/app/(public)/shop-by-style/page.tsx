import { prisma } from '@/lib/prisma'
import StylesHero from '@/components/styles/StylesHero'
import StylesMasonryGrid from '@/components/styles/StylesMasonryGrid'
import { EmptyState } from '@/components/ui/EmptyState'

export const revalidate = 60

export const metadata = {
  title: 'Shop by Style',
  description: 'Browse Toronto Blue Jays merchandise curated by style — jerseys, hats, game day fits, and more.',
}

export default async function ShopByStylePage() {
  const [styleRows, initialHeroSlides] = await Promise.all([
    prisma.styleCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    }),
    prisma.heroSlide
      .findMany({
        where: { scope: 'STYLE_LANDING', active: true },
        orderBy: { sortOrder: 'asc' },
      })
      .catch(() => []),
  ])

  const styles = styleRows.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    coverImageUrl: s.coverImageUrl,
    coverVideoUrl: s.heroVideoUrl,
    productCount: s._count.products,
  }))

  return (
    <div className="bg-white">
      <StylesHero initialSlides={initialHeroSlides} />

      <div className="mx-auto w-full max-w-7xl bg-white px-1 py-1 sm:px-1.5 sm:py-1.5">
        {styles.length === 0 ? (
          <EmptyState
            title="No styles available right now"
            body="Check back soon for curated style collections."
          />
        ) : (
          <StylesMasonryGrid styles={styles} />
        )}
      </div>
    </div>
  )
}
