import HomePageClient from '@/components/home/HomePageClient'
import BrandCatalogPreview from '@/components/home/BrandCatalogPreview'
import PlayerCatalogPreview from '@/components/home/PlayerCatalogPreview'
import LinkedGearPreview from '@/components/home/LinkedGearPreview'
import { getHeroSlides } from '@/lib/hero/getHeroSlides'
import { prisma } from '@/lib/prisma'

// Homepage content (hero slides, brand/player/gear previews, partner
// marquee) only changes via admin mutations — all of which already call
// revalidatePath('/') on their respective routes (hero-slides, brands).
// ISR with a 60s TTL replaces the previous force-dynamic (fresh DB hit on
// every single request) while still staying fresh for admin edits.
export const revalidate = 60

export default async function HomePage() {
  // Fetch active HOME hero slides on the server so the correct hero media
  // (or the default fallback banner, when none are configured) is present in
  // the very first render — avoiding a flash of the default background
  // before the client-side slideshow fetch would otherwise resolve.
  const [initialHeroSlides, brands] = await Promise.all([
    getHeroSlides('HOME'),
    prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      select: { name: true, slug: true, imageUrl: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <HomePageClient initialHeroSlides={initialHeroSlides} brands={brands}>
      <BrandCatalogPreview />
      <PlayerCatalogPreview />
      <LinkedGearPreview />
    </HomePageClient>
  )
}
