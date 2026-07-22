import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import GalleryPageClient from '@/components/gallery/GalleryPageClient'

// Store gallery photos change rarely (only via admin uploads/edits), so a
// 5-minute ISR TTL — busted on-demand by admin gallery mutations via
// revalidatePath('/gallery') — avoids hitting Postgres on every visit the
// way the previous client-fetch + force-dynamic API route did.
export const revalidate = 300

export default async function GalleryPage() {
  const [images, categoryGroups] = await Promise.all([
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
  ])

  const categories = categoryGroups.map((c) => ({
    name: c.category,
    count: c._count.category,
  }))

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-jays-navy py-10 sm:py-14 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {images[0]?.imageUrl && (
            <Image src={images[0].imageUrl} alt="" fill className="object-cover" unoptimized priority />
          )}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Back to shop
          </Link>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight">
            Store Gallery
          </h1>
          <p className="text-white/80 text-sm sm:text-base mt-2 max-w-2xl">
            Take a look inside the Jays Shop — seasonal displays, visual merchandising, and the atmosphere waiting for you at Rogers Centre.
          </p>
          <Link
            href="https://www.google.com/maps/search/?api=1&query=Rogers+Centre+Toronto+Blue+Jays+Shop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-jays-red hover:text-white text-sm font-semibold transition-colors"
          >
            <MapPin size={16} /> Find us at Rogers Centre
          </Link>
        </div>
      </section>

      <GalleryPageClient images={images} categories={categories} />
    </div>
  )
}
