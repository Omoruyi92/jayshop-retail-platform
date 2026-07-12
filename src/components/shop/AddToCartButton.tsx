'use client'

import { useCart } from '@/lib/store/CartContext'
import type { Product } from '@prisma/client'
import { ShoppingCart, Plus } from 'lucide-react'

interface Props {
  product: Product
  selectedSize?: string
  sizes: string[]
  sizeAvailability: { size: string; available: number }[] | null
  remaining: number
  isSoldOut: boolean
  quantity?: number
}

export default function AddToCartButton({
  product,
  selectedSize,
  sizes,
  sizeAvailability,
  remaining,
  isSoldOut,
  quantity = 1,
}: Props) {
  const { addItem } = useCart()

  if (isSoldOut) return null

  const hasSizes = sizes.length > 0
  const needsSize = hasSizes && !selectedSize

  function handleAdd() {
    if (needsSize) return
    const effectiveAvailability = sizeAvailability
      ? sizeAvailability.find((s) => s.size === selectedSize)?.available ?? remaining
      : remaining
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      priceCents: product.priceCents,
      size: selectedSize,
      quantity,
    })
  }

  return (
    <button
      onClick={handleAdd}
      disabled={needsSize}
      title={needsSize ? 'Select a size first' : 'Add to cart'}
      className={`w-full flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-wide text-sm py-3 rounded-xl transition-colors duration-150 active:scale-[0.98] ${
        needsSize
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-jays-navy text-white hover:bg-jays-royal'
      }`}
    >
      <ShoppingCart size={18} />
      <span>{needsSize ? 'Select Size' : 'Add to Cart'}</span>
      {!needsSize && <Plus size={16} className="ml-0.5" />}
    </button>
  )
}
