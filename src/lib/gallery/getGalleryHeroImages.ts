import { prisma } from '@/lib/prisma'

// Server-side data fetch for the Gallery page's hero section. Deliberately
// independent from src/lib/hero/getHeroSlides.ts (HeroSlide/SlideScope) —
// that system is stability-critical/closed and out of scope here. This
// helper is small and self-contained so the Gallery hero can evolve on its
// own without touching the existing Home/Shop/Style/Players hero pipeline.
export interface GalleryHeroImageData {
  id: string
  imageUrl: string
  altText: string | null
}

export async function getGalleryHeroImages(): Promise<GalleryHeroImageData[]> {
  const images = await prisma.galleryHeroImage.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: { id: true, imageUrl: true, altText: true },
  })
  return images
}
