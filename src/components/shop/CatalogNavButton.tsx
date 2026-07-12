'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'

export default function CatalogNavButton() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Show on any player-specific shop bundle (/shop?productIds=...&player=...)
  const playerParam = searchParams?.get('player')?.trim() ?? ''
  const isPlayerShopBundle = pathname?.startsWith('/shop') && playerParam.length > 0

  if (!isPlayerShopBundle) return null

  return (
    <Link
      href="/shop"
      aria-label="Back to full shop catalog"
      className="fixed z-40 hidden sm:flex items-center justify-center rounded-full bg-jays-navy text-white shadow-lg hover:bg-jays-royal transition-colors
        bottom-6 left-6 w-12 h-12
        focus:outline-none focus:ring-2 focus:ring-jays-royal/50"
    >
      <ShoppingBag size={22} />
    </Link>
  )
}
