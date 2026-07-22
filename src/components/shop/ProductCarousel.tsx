'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/shop/ProductCard'
import Reveal from '@/components/ui/Reveal'

type CarouselProduct = Parameters<typeof ProductCard>[0]['product'] & {
  id: string
  quantity: number
  heldQuantity: number
  // Optional precomputed availability — when provided (e.g. from the shop
  // catalog's /api/products response, which already accounts for
  // pickedQuantity and per-size stock), it takes precedence over the
  // simple quantity - heldQuantity fallback below.
  remaining?: number
  hasSizes?: boolean
  allSizesOos?: boolean
}

/**
 * Shared horizontal-scroll product carousel: scroll-snap track,
 * scrollbar-hide, desktop hover arrow buttons that auto-hide at scroll
 * ends, and native touch-swipe on mobile. Originally built for "You May
 * Also Like" (see YouMayAlsoLike.tsx) and reused for the Shop catalog's
 * category-grouped rows and brand catalog product rows so the whole site
 * shares one carousel implementation/style.
 */
export default function ProductCarousel({
  products,
  currentFilters,
}: {
  products: CarouselProduct[]
  currentFilters?: Parameters<typeof ProductCard>[0]['currentFilters']
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateArrows() {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length])

  function scrollByCard(direction: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 -translate-x-2 rounded-full bg-white p-2 text-jays-navy shadow-lg shadow-black/10 ring-1 ring-black/5 transition-transform hover:scale-105 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-2 rounded-full bg-white p-2 text-jays-navy shadow-lg shadow-black/10 ring-1 ring-black/5 transition-transform hover:scale-105 sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:gap-5"
      >
        {products.map((product, index) => {
          const remaining = product.remaining ?? Math.max(0, product.quantity - product.heldQuantity)
          return (
            <Reveal
              key={product.id}
              index={index}
              className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]"
            >
              <div data-card>
                <ProductCard
                  product={product}
                  remaining={remaining}
                  hasSizes={product.hasSizes}
                  allSizesOos={product.allSizesOos}
                  currentFilters={currentFilters}
                />
              </div>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
