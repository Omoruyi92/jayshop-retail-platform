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
      <div className="bg-white rounded-2xl overflow-hidden border border-border shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-jays-navy/30">
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
        <div className="p-3">
          <p className="font-display font-semibold text-jays-navy uppercase text-sm leading-tight line-clamp-2" title={product.name}>
            {product.name}
          </p>
          <p className="font-bold text-jays-red mt-1 text-base">{formatCAD(product.priceCents)}</p>
          {!isSoldOut && (
            <p className="text-xs text-jays-steel mt-0.5">{remaining} left</p>
          )}
          {product.colors && Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="flex gap-1 mt-2">
              {product.colors.slice(0, 3).map((c: any) => {
                const hex = typeof c === 'string' ? c : c.hex || c.name;
                return <div key={hex} className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: hex }} title={typeof c === 'string' ? c : c.name} />
              })}
              {product.colors.length > 3 && <span className="text-[10px] text-gray-500 ml-1">+{product.colors.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}