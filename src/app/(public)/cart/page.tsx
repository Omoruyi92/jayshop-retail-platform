'use client'

import { useCart } from '@/lib/store/CartContext'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatCAD } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export default function CartPage() {
  const { items, count, totalCents, updateQuantity, removeItem, clearCart } = useCart()
  const router = useRouter()
  const [converting, setConverting] = useState<Record<string, boolean>>({})

  if (count === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto bg-jays-ice rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-jays-navy" />
        </div>
        <h1 className="font-display text-2xl font-bold text-jays-navy mb-2">Your Cart is Empty</h1>
        <p className="text-jays-steel mb-6">Add some gear and come back to reserve it.</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-jays-navy text-white px-6 py-3 rounded-xl font-semibold hover:bg-jays-royal transition-colors"
        >
          <ArrowRight size={18} /> Browse Shop
        </Link>
      </div>
    )
  }

  async function convertToHold(productId: string, size?: string) {
    setConverting((prev) => ({ ...prev, [`${productId}-${size ?? ''}`]: true }))
    try {
      const item = items.find((i) => i.productId === productId && i.size === size)
      if (!item) return
      const params = new URLSearchParams({ convertToHold: '1' })
      if (size) params.set('size', size)
      if (item.quantity > 1) params.set('qty', String(item.quantity))
      router.push(`/shop/${item.slug}?${params.toString()}`)
    } finally {
      setConverting((prev) => ({ ...prev, [`${productId}-${size ?? ''}`]: false }))
    }
  }

  return (
    <div className="min-w-0 max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-jays-navy">Your Cart ({count})</h1>
        <button
          onClick={() => {
            clearCart()
            toast.success('Cart cleared')
          }}
          className="text-sm text-jays-steel hover:text-jays-red flex items-center gap-1 shrink-0"
        >
          <Trash2 size={16} /> <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr,280px] gap-4 min-w-0">
        <ul className="space-y-3 min-w-0">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.size ?? 'default'}`}
              className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm min-w-0"
            >
              <Link href={`/shop/${item.slug}`} className="relative w-20 h-24 rounded-xl overflow-hidden bg-jays-ice shrink-0">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/shop/${item.slug}`} className="block font-semibold text-jays-navy truncate hover:text-jays-royal">
                  {item.name}
                </Link>
                {item.size && <p className="text-xs text-jays-steel">Size: {item.size}</p>}
                <p className="text-sm font-bold text-jays-navy mt-1">{formatCAD(item.priceCents)}</p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-jays-navy shrink-0"
                      aria-label="Decrease"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-jays-navy shrink-0"
                      aria-label="Increase"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.size)}
                    className="text-jays-steel hover:text-jays-red p-1.5 shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm h-fit min-w-0">
          <h2 className="font-bold text-jays-navy mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-jays-steel">Subtotal</span>
            <span className="font-semibold text-jays-navy">{formatCAD(totalCents)}</span>
          </div>
          <p className="text-xs text-jays-steel mb-4 break-words">Taxes calculated at checkout. Pickup in-store only.</p>
          <button
            onClick={() => toast.info('Checkout flow coming soon')}
            className="w-full bg-jays-red text-white rounded-xl py-3 font-semibold hover:bg-red-600 transition-colors mb-2"
          >
            Proceed to Checkout
          </button>
          <button
            onClick={() => router.push('/shop')}
            className="w-full border border-jays-navy text-jays-navy rounded-xl py-3 font-semibold hover:bg-jays-ice transition-colors"
          >
            Continue Shopping
          </button>

          {/* Convert eligible items */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-jays-navy mb-2 flex items-center gap-2">
              <Heart size={14} className="text-jays-red" /> Convert to Hold
            </h3>
            <p className="text-xs text-jays-steel mb-3">
              Prefer to reserve? Jump to a product and place a free in-store hold.
            </p>
            <div className="space-y-2">
              {items.map((item) => {
                const key = `${item.productId}-${item.size ?? ''}`
                return (
                  <button
                    key={key}
                    disabled={converting[key]}
                    onClick={() => convertToHold(item.productId, item.size)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl border border-gray-200 hover:border-jays-navy hover:bg-jays-ice/50 transition-colors text-xs font-medium text-jays-navy min-w-0"
                  >
                    <span className="truncate pr-2">{item.name}{item.size ? ` · ${item.size}` : ''}</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
