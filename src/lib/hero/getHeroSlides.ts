import { prisma } from '@/lib/prisma'
import type { HeroScope, Slide } from '@/types/hero'

/**
 * Server-side fetch of active hero slides for a given scope, used by the
 * Home/Shop/Shop-by-Style page server components so the correct hero media
 * (or the default fallback banner, when none configured) is present on the
 * very first render — avoiding a flash of the default background before a
 * client-side slideshow fetch would otherwise resolve.
 *
 * Swallows errors and returns an empty array so a hero-slide query failure
 * never breaks the page itself (matches the previous per-page `.catch(() =>
 * [])` behavior).
 */
export async function getHeroSlides(scope: HeroScope): Promise<Slide[]> {
  return prisma.heroSlide
    .findMany({
      where: { scope, active: true },
      orderBy: { sortOrder: 'asc' },
    })
    .catch(() => [])
}
