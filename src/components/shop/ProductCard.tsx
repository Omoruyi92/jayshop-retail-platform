'use client'
import Link from 'next/link'
import Image from 'next/image'
import { formatCAD } from '@/lib/utils'
import StatusChip from '@/components/ui/StatusChip'
import LicensedBadge from '@/components/ui/LicensedBadge'
import ChampionBadge from '@/components/ui/ChampionBadge'
import { saveShopState } from '@/lib/shop/shopState'

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
  priceCents: number
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
  const displayStatus = isSoldOut ? 'SOLD_OUT' : 'AVAILABLE'

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
      className={`group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jays-navy/40 rounded-2xl ${isSoldOut ? 'opacity-50 grayscale pointer-events-none' : ''}`}
    >
      <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-jays-navy/10 group-hover:border-jays-navy/25">
        <div className="relative aspect-[3/4] bg-jays-ice overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            <StatusChip status={displayStatus} />
          </div>
          {!isSoldOut && (product.isLicensed || product.isChampion) && (
            <div className="absolute bottom-2 left-2 flex flex-col gap-1">
              {product.isLicensed && <LicensedBadge variant="card" />}
              {product.isChampion && <ChampionBadge variant="card" />}
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="font-display font-semibold text-jays-navy uppercase text-sm leading-tight line-clamp-2 tracking-wide" title={product.name}>
            {product.name}
          </p>
          <p className="font-bold text-jays-red mt-1.5 text-base">{formatCAD(product.priceCents)}</p>
          {!isSoldOut && (
            <p className="text-xs text-jays-steel mt-1">{remaining} left</p>
          )}
        </div>
      </div>
    </Link>
  )
}