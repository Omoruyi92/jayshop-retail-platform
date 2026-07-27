'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImageGalleryProps {
  images: string[]
  alt: string
}

const IMAGE_LABELS = ['Front & Back', 'Front View', 'Back View']

export default function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  // Bumped only for click-to-rotate steps so the Image remounts and replays
  // the rotation animation. Arrow clicks and thumbnail/dot picks leave this
  // untouched, so they swap the image instantly with no animation.
  const [animateTick, setAnimateTick] = useState(0)

  const hasMultiple = images.length > 1

  // Circular navigation: wraps around at both ends (last → first, first →
  // last), whether triggered by click-to-rotate, the arrows, or a
  // thumbnail/dot pick.
  const goToIndex = (i: number, animate: boolean) => {
    const wrapped = ((i % images.length) + images.length) % images.length
    setActiveIndex(wrapped)
    if (animate) setAnimateTick((t) => t + 1)
  }

  // Click/tap directly on the image: single-step advance with the rotation
  // animation, wrapping back to the first image after the last.
  const handleTap = () => {
    if (!hasMultiple) return
    goToIndex(activeIndex + 1, true)
  }

  // Arrows: instant switch to the adjacent image (wraps around), no animation.
  const goPrev = () => goToIndex(activeIndex - 1, false)
  const goNext = () => goToIndex(activeIndex + 1, false)

  // Thumbnail/dot picks: instant jump, no animation.
  const selectImage = (i: number) => goToIndex(i, false)

  const arrows = (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          goPrev()
        }}
        disabled={!hasMultiple}
        aria-label="Previous image"
        title="Previous image"
        className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all z-20 group ${
          hasMultiple
            ? 'text-white/40 drop-shadow-sm hover:bg-white/10 hover:text-white/80 focus-visible:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95'
            : 'text-gray-300 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          goNext()
        }}
        disabled={!hasMultiple}
        aria-label="Next image"
        title="Next image"
        className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full transition-all z-20 group ${
          hasMultiple
            ? 'text-white/40 drop-shadow-sm hover:bg-white/10 hover:text-white/80 focus-visible:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95'
            : 'text-gray-300 cursor-not-allowed'
        }`}
      >
        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </>
  )

  if (!hasMultiple) {
    return (
      <div className="absolute inset-0" style={{ position: 'absolute', inset: 0 }}>
        <Image
          src={images[0] || '/placeholder.png'}
          alt={alt}
          fill
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="object-contain p-0 lg:p-4"
          style={{ position: 'absolute', inset: 0 }}
          priority
        />
        {arrows}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ position: 'absolute', inset: 0 }}>
      {/* Main image */}
      <div
        className="relative flex-1 min-h-0 [perspective:1200px] cursor-pointer"
        style={{ position: 'relative' }}
        onClick={handleTap}
      >
        <Image
          key={animateTick}
          src={images[activeIndex]}
          alt={`${alt} — ${IMAGE_LABELS[activeIndex] ?? `Image ${activeIndex + 1}`}`}
          fill
          sizes="(max-width: 1023px) 100vw, 50vw"
          className={`object-contain p-0 lg:p-4 ${animateTick > 0 ? 'animate-image-cycle' : ''}`}
          style={{ position: 'absolute', inset: 0 }}
          priority={activeIndex === 0}
        />

        {arrows}
      </div>

      {/* Thumbnail strip */}
      <div className="flex items-center justify-center gap-2 px-3 lg:px-4 py-2 bg-white/90 lg:bg-white/80 backdrop-blur-sm border-t border-gray-100">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => selectImage(i)}
            className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              i === activeIndex
                ? 'border-jays-navy shadow-md scale-105'
                : 'border-gray-200 hover:border-jays-steel opacity-70 hover:opacity-100'
            }`}
          >
            <Image
              src={src}
              alt={IMAGE_LABELS[i] ?? `View ${i + 1}`}
              fill
              sizes="56px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Dot indicators — desktop only. On mobile the image is edge-to-edge
          (see commit e0b1701), so dots sitting over the top of the image
          would overlap product graphics/logos; the thumbnail strip below
          already conveys the active image on mobile. */}
      <div className="hidden absolute top-3 left-1/2 -translate-x-1/2 gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => selectImage(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIndex ? 'bg-jays-navy w-5' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={IMAGE_LABELS[i] ?? `Image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
