import { prisma } from '@/lib/prisma'
import GalleryPageClient from '@/components/gallery/GalleryPageClient'
import GalleryHero from '@/components/gallery/GalleryHero'
import HeroPreload from '@/components/hero/HeroPreload'
import { getHeroSlides } from '@/lib/hero/getHeroSlides'

// Store gallery photos change rarely (only via admin uploads/edits), so a
// 5-minute ISR TTL — busted on-demand by admin gallery mutations via
// revalidatePath('/gallery') — avoids hitting Postgres on every visit the
// way the previous client-fetch + force-dynamic API route did.
export const revalidate = 300

export default async function GalleryPage() {
  const [images, categoryGroups, heroSlides] = await Promise.all([
    prisma.storeGalleryImage.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        imageUrl: true,
        sortOrder: true,
      },
    }),
    prisma.storeGalleryImage.groupBy({
      by: ['category'],
      where: { status: 'ACTIVE' },
      _count: { category: true },
    }),
    getHeroSlides('GALLERY'),
  ])

  const categories = categoryGroups.map((c) => ({
    name: c.category,
    count: c._count.category,
  }))

  return (
    <div className="min-h-screen bg-white">
      <HeroPreload slides={heroSlides} />
      <GalleryHero initialSlides={heroSlides} />
      <GalleryPageClient images={images} categories={categories} />
    </div>
  )
}
