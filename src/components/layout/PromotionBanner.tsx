'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { usePromotions } from '@/lib/promotions/PromotionsContext'

const DISMISS_KEY = 'jays-shop-promo-dismissed'

export default function PromotionBanner() {
  const promotions = usePromotions()
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Persisted in localStorage (not sessionStorage) so a dismissed promo
    // stays dismissed across new tabs/sessions, not just page refreshes —
    // it only reappears once an admin publishes a genuinely new promotion
    // (a different id).
    try {
      const raw = localStorage.getItem(DISMISS_KEY)
      setDismissed(raw ? JSON.parse(raw) : [])
    } catch {
      setDismissed([])
    } finally {
      setLoaded(true)
    }
  }, [])

  const visible = promotions.filter((p) => !dismissed.includes(p.id))

  if (!loaded || visible.length === 0) return null

  function handleDismiss(id: string) {
    const next = [...dismissed, id]
    setDismissed(next)
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next))
    } catch { /* ignore */ }
  }

  return (
    <div className="bg-jays-red text-white">
      {visible.map((promo) => {
        const content = (
          <span className="font-semibold uppercase tracking-wide text-xs sm:text-sm">
            {promo.text}
          </span>
        )
        return (
          <div
            key={promo.id}
            className="relative flex items-center justify-center gap-2 px-8 py-2 text-center border-b border-white/10 last:border-b-0"
          >
            {promo.link ? (
              <Link href={promo.link} className="hover:underline">
                {content}
              </Link>
            ) : (
              content
            )}
            <button
              type="button"
              onClick={() => handleDismiss(promo.id)}
              aria-label="Dismiss promotion"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
