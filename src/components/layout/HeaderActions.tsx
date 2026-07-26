'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useCart } from '@/lib/store/CartContext'
import { useFavorites } from '@/lib/store/FavoritesContext'
import { formatCAD } from '@/lib/utils'
import { Heart, ShoppingBag, X, Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDropdownPosition } from '@/hooks/useDropdownPosition'
import NotificationBell from './NotificationBell'

export default function HeaderActions() {
  const { count: cartCount, items: cartItems, removeItem, updateQuantity, totalCents } = useCart()
  const { count: favoritesCount, favorites, remove } = useFavorites()
  const [cartOpen, setCartOpen] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const cartTriggerRef = useRef<HTMLButtonElement>(null)
  const cartPanelRef = useRef<HTMLDivElement>(null)
  const favTriggerRef = useRef<HTMLButtonElement>(null)
  const favPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        cartTriggerRef.current && !cartTriggerRef.current.contains(target) &&
        cartPanelRef.current && !cartPanelRef.current.contains(target)
      ) {
        setCartOpen(false)
      }
      if (
        favTriggerRef.current && !favTriggerRef.current.contains(target) &&
        favPanelRef.current && !favPanelRef.current.contains(target)
      ) {
        setFavoritesOpen(false)
      }
    }
    if (cartOpen || favoritesOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [cartOpen, favoritesOpen])

  return (
    <div className="flex items-center gap-1 sm:gap-2 mr-0 sm:mr-1">
      {/* Notifications */}
      <NotificationBell />

      {/* Favorites */}
      <div className="relative">
        <button
          ref={favTriggerRef}
          onClick={() => { setFavoritesOpen((p) => !p); setCartOpen(false) }}
          aria-label={`Favorites (${favoritesCount})`}
          className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Heart
            className={`w-[18px] h-[18px] transition-colors ${favoritesCount > 0 ? 'text-jays-red fill-jays-red' : 'text-white'}`}
            strokeWidth={1.8}
          />
          {favoritesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-jays-red text-white text-[10px] font-bold border-2 border-jays-navy">
              {favoritesCount}
            </span>
          )}
        </button>

        {favoritesOpen && (
          <FavoritesDropdown
            favorites={favorites}
            remove={remove}
            close={() => setFavoritesOpen(false)}
            triggerRef={favTriggerRef}
            panelRef={favPanelRef}
          />
        )}
      </div>

      {/* Cart */}
      <div className="relative">
        <button
          ref={cartTriggerRef}
          onClick={() => { setCartOpen((p) => !p); setFavoritesOpen(false) }}
          aria-label={`Cart (${cartCount})`}
          className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ShoppingBag className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-jays-red text-white text-[10px] font-bold border-2 border-jays-navy">
              {cartCount}
            </span>
          )}
        </button>

        {cartOpen && (
          <CartDropdown
            items={cartItems}
            totalCents={totalCents}
            remove={removeItem}
            update={updateQuantity}
            close={() => setCartOpen(false)}
            triggerRef={cartTriggerRef}
            panelRef={cartPanelRef}
          />
        )}
      </div>
    </div>
  )
}

function FavoritesDropdown({
  favorites,
  remove,
  close,
  triggerRef,
  panelRef,
}: {
  favorites: ReturnType<typeof useFavorites>['favorites']
  remove: (id: string) => void
  close: () => void
  triggerRef: React.RefObject<HTMLButtonElement>
  panelRef: React.RefObject<HTMLDivElement>
}) {
  const style = useDropdownPosition(true, triggerRef, panelRef)
  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className="w-80 sm:w-96 max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-jays-navy">Your Favorites</h3>
          <p className="text-xs text-jays-steel">{favorites.length} item{favorites.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={close} aria-label="Close favorites" className="p-1.5 rounded-lg text-jays-steel hover:bg-jays-ice transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="p-6 text-center text-sm text-jays-steel">
            No favorites yet. Tap the heart on any product to save it.
          </div>
        ) : (
          <ul className="py-1">
            {favorites.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 px-4 py-3 hover:bg-jays-ice/50 transition-colors">
                <Link href={`/shop/${item.slug}`} onClick={close} className="relative w-14 h-14 rounded-lg overflow-hidden bg-jays-ice shrink-0 border border-gray-100">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${item.slug}`} onClick={close} className="block text-sm font-semibold text-jays-navy truncate hover:text-jays-royal">
                    {item.name}
                  </Link>
                  <p className="text-xs text-jays-steel">{formatCAD(item.priceCents)}</p>
                </div>
                <button
                  onClick={() => remove(item.productId)}
                  aria-label="Remove from favorites"
                  className="p-2 rounded-lg text-jays-steel hover:text-jays-red hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <Link
          href="/shop"
          onClick={close}
          className="block w-full text-center bg-jays-navy text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-jays-royal transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>,
    document.body
  )
}

function CartDropdown({
  items,
  totalCents,
  remove,
  update,
  close,
  triggerRef,
  panelRef,
}: {
  items: ReturnType<typeof useCart>['items']
  totalCents: number
  remove: (productId: string, size?: string) => void
  update: (productId: string, quantity: number, size?: string) => void
  close: () => void
  triggerRef: React.RefObject<HTMLButtonElement>
  panelRef: React.RefObject<HTMLDivElement>
}) {
  const style = useDropdownPosition(true, triggerRef, panelRef)
  return createPortal(
    <div
      ref={panelRef}
      style={style}
      className="w-80 sm:w-96 max-w-[calc(100vw-16px)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-jays-navy">Your Cart</h3>
          <p className="text-xs text-jays-steel">{items.length} item{items.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={close} aria-label="Close cart" className="p-1.5 rounded-lg text-jays-steel hover:bg-jays-ice transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-jays-steel">
            Your cart is empty.
          </div>
        ) : (
          <ul className="py-1">
            {items.map((item) => (
              <li key={`${item.productId}-${item.size ?? 'default'}`} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/shop/${item.slug}`} onClick={close} className="relative w-14 h-14 rounded-lg overflow-hidden bg-jays-ice shrink-0 border border-gray-100">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/shop/${item.slug}`} onClick={close} className="block text-sm font-semibold text-jays-navy truncate hover:text-jays-royal">
                    {item.name}
                  </Link>
                  {item.size && <p className="text-[11px] text-jays-steel">Size: {item.size}</p>}
                  <p className="text-xs font-semibold text-jays-navy">{formatCAD(item.priceCents)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => update(item.productId, item.quantity - 1, item.size)}
                      aria-label="Decrease quantity"
                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:border-jays-navy"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => update(item.productId, item.quantity + 1, item.size)}
                      aria-label="Increase quantity"
                      className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:border-jays-navy"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(item.productId, item.size)}
                    aria-label="Remove item"
                    className="text-[11px] text-jays-steel hover:text-jays-red flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {items.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-jays-steel">Subtotal</span>
            <span className="font-bold text-jays-navy">{formatCAD(totalCents)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/cart"
              onClick={close}
              className="text-center border border-jays-navy text-jays-navy rounded-xl py-2.5 text-sm font-semibold hover:bg-jays-ice transition-colors"
            >
              View Cart
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toast.info('Checkout flow coming soon')
              }}
              className="text-center bg-jays-red text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Checkout
            </button>
          </div>
          <p className="text-[10px] text-center text-jays-steel">Eligible items can be converted to in-store holds from the cart page.</p>
        </div>
      )}
    </div>,
    document.body
  )
}
