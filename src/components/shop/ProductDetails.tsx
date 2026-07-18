'use client'
import { useState, useEffect, useCallback } from 'react'
import HoldButton from '@/components/shop/HoldButton'
import StadiumAvailability, { LocationInventory } from '@/components/shop/StadiumAvailability'
import AddToCartButton from '@/components/shop/AddToCartButton'
import StatusChip from '@/components/ui/StatusChip'
import LicensedBadge from '@/components/ui/LicensedBadge'
import ChampionBadge from '@/components/ui/ChampionBadge'
import BackToShopButton from '@/components/shop/BackToShopButton'
import { formatCAD } from '@/lib/utils'
import type { Product } from '@prisma/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useFavorites } from '@/lib/store/FavoritesContext'
import { Heart } from 'lucide-react'
import { useInventoryStream } from '@/hooks/useInventoryStream'

interface SizeAvailability {
  size: string
  available: number
}

interface Props {
  product: Product
  remaining: number
  isSoldOut: boolean
  sizes: string[]
  displayStatus: string
  sizeAvailability: SizeAvailability[] | null
  locationInventory?: LocationInventory[]
}

export default function ProductDetails({ product: initialProduct, remaining: initialRemaining, isSoldOut, sizes, displayStatus, sizeAvailability: initialSizeAvailability, locationInventory: initialLocationInventory }: Props) {
  const { t } = useLanguage()
  const pd = t.product
  const { isLiked, toggle } = useFavorites()
  const [selectedSize, setSelectedSize] = useState('')

  const [product, setProduct] = useState<Product>(initialProduct)
  const [remaining, setRemaining] = useState(initialRemaining)
  const [sizeAvailability, setSizeAvailability] = useState<SizeAvailability[] | null>(initialSizeAvailability)
  const [locationInventory, setLocationInventory] = useState<LocationInventory[] | undefined>(initialLocationInventory)
  const [displayStatusState, setDisplayStatusState] = useState(displayStatus)

  const hasSizes = sizes.length > 0
  const liked = isLiked(product.id)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?slug=${encodeURIComponent(product.slug)}`)
      if (!res.ok) return
      const data = await res.json()
      if (!data.products?.length) return
      const p = data.products[0]
      setProduct((prev) => ({ ...prev, ...p, colors: p.colors ?? prev.colors }))
      setRemaining(p.remaining)
      setDisplayStatusState(p.status === 'SOLD' && p.heldQuantity > 0 ? 'ON_HOLD' : p.status)
      if (p.sizeInventories?.length) {
        setSizeAvailability(p.sizeInventories.map((r: any) => ({ size: r.size, available: Math.max(0, r.quantity - r.heldQuantity - r.pickedQuantity) })))
        setLocationInventory(p.sizeInventories.map((r: any) => ({ size: r.size, locationId: '', locationName: '', quantity: r.quantity, held: r.heldQuantity, available: Math.max(0, r.quantity - r.heldQuantity - r.pickedQuantity) })))
      }
    } catch {
      // ignore network errors
    }
  }, [product.slug])

  useEffect(() => {
    setProduct(initialProduct)
    setRemaining(initialRemaining)
    setSizeAvailability(initialSizeAvailability)
    setLocationInventory(initialLocationInventory)
    setDisplayStatusState(displayStatus)
  }, [initialProduct, initialRemaining, initialSizeAvailability, initialLocationInventory, displayStatus])

  // Real-time sync on PDP so stock/held/sold badges update without refresh.
  useInventoryStream(
    { productId: product.id },
    { onInventoryChanged: refresh, onHoldChanged: refresh }
  )

  const colorOptions: { name: string; hex: string }[] = Array.isArray(product.colors)
    ? (product.colors as any[]).map((c) =>
        typeof c === 'string' ? { name: c, hex: c } : { name: c.name || c.hex || '', hex: c.hex || c.name || '' }
      ).filter((c) => c.hex)
    : []
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]?.name || '')
  const isOnSale = !!product.salePriceCents && product.salePriceCents > 0 && product.salePriceCents < product.priceCents

  function isSizeOos(size: string): boolean {
    if (!sizeAvailability) return false
    const stock = sizeAvailability.find((s) => s.size === size)
    return stock !== undefined && stock.available <= 0
  }

  return (
    <div className="flex flex-col pb-8">
      <BackToShopButton />
      <div className="flex items-start justify-between gap-4 mb-4">
        <h1 className="font-display text-2xl font-bold text-jays-navy uppercase leading-tight">
          {product.name}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <StatusChip status={displayStatusState} held={product.heldQuantity} sold={product.pickedQuantity} />
          <button
            type="button"
            onClick={() =>
              toggle({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.imageUrl,
                priceCents: product.priceCents,
              })
            }
            aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
            title={liked ? 'Remove from favorites' : 'Add to favorites'}
            className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors ${
              liked
                ? 'bg-jays-red/10 border-jays-red text-jays-red'
                : 'border-gray-200 text-gray-400 hover:border-jays-red hover:text-jays-red'
            }`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {(product.isFeatured || product.isNewArrival || product.category.toLowerCase() === 'authentication' || product.isLicensed || product.isChampion) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wide text-jays-navy shadow-sm">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </span>
          )}
          {product.isNewArrival && (
            <span className="rounded-full bg-jays-navy px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wide text-white shadow-sm">
              New Arrival
            </span>
          )}
          {product.category.toLowerCase() === 'authentication' && (
            <span className="rounded-full bg-jays-steel px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wide text-white shadow-sm">
              Authentic
            </span>
          )}
          {product.isLicensed && <LicensedBadge variant="detail" />}
          {product.isChampion && <ChampionBadge variant="detail" />}
        </div>
      )}

      <div className="flex items-baseline gap-3 mb-2">
        <p className="font-display text-3xl font-bold text-jays-red">
          {formatCAD(isOnSale ? product.salePriceCents! : product.priceCents)}
        </p>
        {isOnSale && (
          <>
            <p className="font-display text-lg text-jays-steel line-through">
              {formatCAD(product.priceCents)}
            </p>
            <span className="rounded-full bg-jays-red px-2.5 py-0.5 text-[11px] font-display font-bold uppercase tracking-wide text-white">
              Sale
            </span>
          </>
        )}
      </div>

      {product.brand && (
        <p className="text-xs font-semibold uppercase tracking-widest text-jays-steel mb-3">
          {product.brand}
        </p>
      )}

      <p className="text-sm text-jays-steel mb-4">
        {isSoldOut ? (
          <span className="text-jays-red font-medium">{pd.soldOut}</span>
        ) : (
          <span>{pd.leftInStock(remaining)}</span>
        )}
      </p>

      {product.description && (
        <p className="text-jays-steel text-sm mb-6">{product.description}</p>
      )}

      {colorOptions.length > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color{selectedColor ? <span className="text-jays-steel font-normal ml-1">— {selectedColor}</span> : null}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {colorOptions.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedColor(c.name)}
                title={c.name}
                aria-label={c.name}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === c.name
                    ? 'border-jays-navy ring-2 ring-jays-navy/30 scale-110'
                    : 'border-black/10 hover:border-jays-navy/40'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {hasSizes && !isSoldOut && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Size</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const oos = isSizeOos(size)
              return (
                <button
                  key={size}
                  type="button"
                  disabled={oos}
                  onClick={() => { if (!oos) setSelectedSize(size) }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    oos
                      ? 'opacity-40 cursor-not-allowed line-through bg-gray-100 border-gray-200 text-gray-400'
                      : selectedSize === size
                      ? 'bg-jays-navy text-white border-jays-navy'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-jays-navy'
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <AddToCartButton
          product={product}
          selectedSize={selectedSize || undefined}
          sizes={sizes}
          sizeAvailability={sizeAvailability}
          remaining={remaining}
          isSoldOut={isSoldOut}
        />

        <HoldButton
          product={product}
          remaining={remaining}
          isSoldOut={isSoldOut}
          sizes={sizes}
          sizeAvailability={sizeAvailability}
        />
      </div>

      {locationInventory && locationInventory.length > 0 && (
        <StadiumAvailability locations={locationInventory} selectedSize={selectedSize || null} />
      )}

      {/* Live inventory summary — single source of truth from SizeInventory */}
      <div className="mt-4 rounded-xl bg-jays-ice/40 border border-jays-ice px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-jays-steel mb-1">Inventory</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-jays-navy font-medium">{remaining} available</span>
          {product.heldQuantity > 0 && <span className="text-amber-600 font-medium">{product.heldQuantity} held</span>}
          {product.pickedQuantity > 0 && <span className="text-gray-500 font-medium">{product.pickedQuantity} sold</span>}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h3 className="font-display font-semibold text-jays-navy uppercase mb-3">
          {pd.howHoldsWork}
        </h3>
        <ul className="text-sm text-jays-steel space-y-2">
          {pd.faqItems.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
