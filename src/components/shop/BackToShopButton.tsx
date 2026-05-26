'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { hasShopState } from '@/lib/shop/shopState'

export default function BackToShopButton() {
  const router = useRouter()

  function handleBack() {
    if (hasShopState()) {
      // Saved state exists — use browser history so ShopPage restores from sessionStorage
      router.back()
    } else {
      // Direct link or expired state — navigate to shop cleanly
      router.push('/shop')
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-sm text-jays-steel hover:text-jays-navy transition-colors duration-150 mb-4 -ml-0.5 group"
      aria-label="Back to shop"
    >
      <ChevronLeft
        size={16}
        className="transition-transform duration-150 group-hover:-translate-x-0.5"
      />
      <span>Back to Shop</span>
    </button>
  )
}
