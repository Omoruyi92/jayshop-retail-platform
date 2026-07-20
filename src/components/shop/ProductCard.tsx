'use client'
import Link from 'next/link'
import Image from 'next/image'
import { saveShopState } from '@/lib/shop/shopState'
import { titleCase } from '@/lib/text'

interface CurrentFilters {
  category: string
  sub: string
  brand: string
  search: string
}

type ProductCardProduct = {
  name: string
  slug: string
  imageUrl: string
  status: string
  isLicensed: boolean
  isChampion: boolean
  isFeatured?: boolean
  isNewArrival?: boolean
  isClearance?: boolean
  priceCents: number
  salePriceCents?: number
  colors?: any
}

export default function ProductCard({
  product,
  remaining,
  hasSizes,
  allSizesOos,
  currentFilters,
}: {
  product: ProductCardProduct
  remaining: number
  hasSizes?: boolean
  allSizesOos?: boolean
  currentFilters?: CurrentFilters
}) {
  const isSoldOut =
    product.status === 'SOLD' ||
    product.status === 'ARCHIVED' ||
    (hasSizes ? allSizesOos === true : remaining <= 0)

  function handleClick() {
    if (currentFilters) {
      saveShopState({
        ...currentFilters,
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      })
    }
  }

  return (
    <Link
      href={`/shop/${product.slug}`}
      onClick={handleClick}
      className={`group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jays-navy/40 ${isSoldOut ? 'opacity-50 grayscale pointer-events-none' : ''}`}
    >
      <div className="group overflow-hidden bg-transparent transition-transform duration-300 ease-out hover:-translate-y-1">
        <div className="relative aspect-[3/4] overflow-hidden" style={{ position: 'relative' }}>
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ position: 'absolute', inset: 0 }}
          />
        </div>
        <div className="p-3">
          <p className="font-semibold text-jays-navy text-sm leading-tight line-clamp-2 tracking-tight" title={product.name}>
            {titleCase(product.name)}
          </p>
        </div>
      </div>
    </Link>
  )
}