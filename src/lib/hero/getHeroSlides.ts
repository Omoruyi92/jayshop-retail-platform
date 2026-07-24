import { prisma } from '@/lib/prisma'
import type { HeroScope, Slide } from '@/types/hero'
import { getBlurDataURL } from './getBlurDataURL'
import { ensureGalleryScope } from './ensureGalleryScope'

/**
 * Server-side fetch of active hero slides for a given scope, used by the
 * Home/Shop/Shop-by-Style page server components so the correct hero media
 * (or the default fallback banner, when none configured) is present on the
 * very first render — avoiding a flash of the default background before a
 * client-side slideshow fetch would otherwise resolve.
 *
 * Each image slide also gets a `blurDataURL` (a tiny inlined preview of the
 * actual photo) attached here, server-side, so it ships embedded in the
 * initial HTML with zero extra round-trips. `HeroSlideshow` uses it as
 * `next/image`'s `placeholder="blur"` so first paint shows a soft preview
 * of the real image instead of exposing the section's solid navy
 * background while the full-res media loads.
 *
 * Swallows errors and returns an empty array so a hero-slide query failure
 * never breaks the page itself (matches the previous per-page `.catch(() =>
 * [])` behavior).
 */
export async function getHeroSlides(scope: HeroScope): Promise<Slide[]> {
  if (scope === 'GALLERY') await ensureGalleryScope()

  const slides = await prisma.heroSlide
    .findMany({
      where: { scope, active: true },
      orderBy: { sortOrder: 'asc' },
    })
    .catch(() => [])

  return Promise.all(
    slides.map(async (slide) => ({
      ...slide,
      blurDataURL: slide.mediaType === 'IMAGE' ? await getBlurDataURL(slide.url) : null,
    }))
  )
}
