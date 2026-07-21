import HomePageClient from '@/components/home/HomePageClient'
import BrandCatalogPreview from '@/components/home/BrandCatalogPreview'
import PlayerCatalogPreview from '@/components/home/PlayerCatalogPreview'
import LinkedGearPreview from '@/components/home/LinkedGearPreview'
import { getHeroSlides } from '@/lib/hero/getHeroSlides'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch active HOME hero slides on the server so the correct hero media
  // (or the default fallback banner, when none are configured) is present in
  // the very first render — avoiding a flash of the default background
  // before the client-side slideshow fetch would otherwise resolve.
  const initialHeroSlides = await getHeroSlides('HOME')

  return (
    <HomePageClient initialHeroSlides={initialHeroSlides}>
      <BrandCatalogPreview />
      <PlayerCatalogPreview />
      <LinkedGearPreview />
    </HomePageClient>
  )
}
