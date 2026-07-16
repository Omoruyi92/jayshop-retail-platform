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
  const displayStatus = isSoldOut ? 'SOLD_OUT' : 'AVAILABLE'
  const isOnSale = !!product.salePriceCents && product.salePriceCents > 0 && product.salePriceCents < product.priceCents
  const showSaleBadge = isOnSale || product.isClearance
  const isLowStock = !isSoldOut && remaining > 0 && remaining <= 3

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
        <div className="relative aspect-[3/4] bg-jays-ice overflow-hidden" style={{ position: 'relative' }}>
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            style={{ position: 'absolute', inset: 0 }}
          />
          {!isSoldOut && (product.isFeatured || product.isNewArrival) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wide text-jays-navy shadow-sm">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured
                </span>
              )}
              {product.isNewArrival && (
                <span className="rounded-full bg-jays-navy px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wide text-white shadow-sm">
                  New
                </span>
              )}
            </div>
          )}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {isSoldOut && <StatusChip status={displayStatus} />}
            {showSaleBadge && !isSoldOut && (
              <span className="rounded-full bg-jays-red px-2 py-0.5 text-[10px] font-display font-bold uppercase tracking-wide text-white shadow-sm">
                Sale
              </span>
            )}
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
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="font-bold text-jays-red text-base">
              {formatCAD(isOnSale ? product.salePriceCents! : product.priceCents)}
            </p>
            {isOnSale && (
              <p className="text-xs text-jays-steel line-through">{formatCAD(product.priceCents)}</p>
            )}
          </div>
          {!isSoldOut && (
            <p className={`text-xs mt-1 ${isLowStock ? 'font-semibold text-amber-600' : 'text-jays-steel'}`}>
              {isLowStock ? `Only ${remaining} left!` : `${remaining} left`}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}