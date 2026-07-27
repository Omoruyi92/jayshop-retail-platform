import { prisma } from '@/lib/prisma'
import StylesHero from '@/components/styles/StylesHero'
import StylesMasonryGrid from '@/components/styles/StylesMasonryGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import HeroPreload from '@/components/hero/HeroPreload'
import { getHeroSlides } from '@/lib/hero/getHeroSlides'

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
    getHeroSlides('STYLE_LANDING'),
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
      <HeroPreload slides={initialHeroSlides} />
      <StylesHero initialSlides={initialHeroSlides} />

      <div className="mx-auto w-full bg-white px-0 py-0">
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
