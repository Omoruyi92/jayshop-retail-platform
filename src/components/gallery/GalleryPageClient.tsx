'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { EmptyState } from '@/components/ui/EmptyState'
import { Images } from 'lucide-react'

export interface GalleryImage {
  id: string
  title: string
  description: string | null
  category: string
  imageUrl: string
  sortOrder: number
}

export interface CategoryCount {
  name: string
  count: number
}

/**
 * Client "island" holding the only interactive parts of the Gallery page
 * (category filter + lightbox modal). The page itself is now an async
 * Server Component with a direct Prisma query + ISR, so this component
 * receives the full image/category lists as props and never fetches on
 * its own — no loading skeleton flash, no client round trip.
 */
export default function GalleryPageClient({
  images,
  categories,
}: {
  images: GalleryImage[]
  categories: CategoryCount[]
}) {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedImage])

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return images
    return images.filter((img) => img.category === activeCategory)
  }, [images, activeCategory])

  return (
    <>
      {/* Category filters */}
      <section
        className="sticky z-20 bg-white border-b border-border shadow-sm"
        style={{ top: 'calc(var(--header-height, 3.5rem) + var(--subnav-height, 2.75rem))' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('All')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === 'All'
                  ? 'bg-jays-navy text-white'
                  : 'bg-jays-ice text-jays-navy hover:bg-jays-ice/80'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.name
                    ? 'bg-jays-navy text-white'
                    : 'bg-jays-ice text-jays-navy hover:bg-jays-ice/80'
                }`}
              >
                {cat.name}
                <span className="ml-1.5 text-[10px] opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Images size={40} className="text-jays-steel/40" />}
            title={images.length === 0 ? 'Gallery coming soon' : 'No photos in this category'}
            body={images.length === 0 ? 'We are preparing store photos to share with you.' : 'Choose another category or check back later.'}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((img, index) => (
              <GalleryCard
                key={img.id}
                image={img}
                priority={index === 0}
                onReadMore={() => setSelectedImage(img)}
              />
            ))}
          </div>
        )}
      </section>

      {selectedImage && (
        <GalleryModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </>
  )
}

function GalleryCard({
  image,
  priority,
  onReadMore,
}: {
  image: GalleryImage
  priority?: boolean
  onReadMore: () => void
}) {
  const hasDescription = Boolean(image.description)

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-[4/3] w-full bg-jays-ice overflow-hidden">
        <Image
          src={image.imageUrl}
          alt={image.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
          priority={priority}
        />
      </div>

      <div className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-jays-red font-semibold mb-1">{image.category}</p>
        <h3 className="font-display font-bold text-jays-navy text-base leading-tight">{image.title}</h3>
        {hasDescription && (
          <button
            onClick={onReadMore}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-jays-red hover:text-jays-navy transition-colors"
          >
            Read more
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function GalleryModal({
  image,
  onClose,
}: {
  image: GalleryImage
  onClose: () => void
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setShow(true), 10)
    return () => window.clearTimeout(timer)
  }, [])

  function close() {
    setShow(false)
    window.setTimeout(() => onClose(), 200)
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={close}
    >
      <div
        className={`bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl transition-transform duration-200 ${
          show ? 'scale-100' : 'scale-[0.96]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-[4/3] bg-jays-ice shrink-0 overflow-hidden rounded-t-2xl">
          <Image
            src={image.imageUrl}
            alt={image.title}
            fill
            className="object-cover"
            unoptimized
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
        <div className="p-5 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-jays-red font-semibold mb-1">{image.category}</p>
          <h3 className="font-display font-bold text-jays-navy text-lg leading-tight mb-2">{image.title}</h3>
          <p className="text-sm text-jays-steel leading-relaxed whitespace-pre-line">{image.description}</p>
          <button
            onClick={close}
            className="mt-5 w-full bg-jays-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-jays-royal transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
