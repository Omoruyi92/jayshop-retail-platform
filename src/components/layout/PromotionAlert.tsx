'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Megaphone } from 'lucide-react'
import { usePromotions } from '@/lib/promotions/PromotionsContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const STORAGE_KEY = 'dismissedPromotionId'

interface PromotionAlertProps {
  initialHasPromotions: boolean
}

export default function PromotionAlert({ initialHasPromotions }: PromotionAlertProps) {
  const promotions = usePromotions()
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      setDismissedId(sessionStorage.getItem(STORAGE_KEY))
    } catch {
      // sessionStorage may be unavailable in some contexts
    }
  }, [])

  // The list is already sorted by priority desc, then createdAt desc.
  const activePromotion = promotions[0]
  const isVisible = mounted && Boolean(activePromotion) && activePromotion!.id !== dismissedId

  // Reserve height on the very first paint if the server thought a promotion
  // was active. This prevents layout shift while the client checks sessionStorage.
  const reserveHeight = !mounted && initialHasPromotions

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!activePromotion) return
    try {
      sessionStorage.setItem(STORAGE_KEY, activePromotion.id)
    } catch {
      // ignore
    }
    setDismissedId(activePromotion.id)
  }

  return (
    <div
      className={`transition-all duration-300 ease-out overflow-hidden ${
        isVisible || reserveHeight ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
      }`}
      aria-hidden={!isVisible}
    >
      {isVisible && activePromotion && (
        <div
          className="bg-jays-navy text-white border-b border-white/10"
          data-testid="promotion-alert-banner"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-3">
            <Megaphone
              className="w-4 h-4 text-jays-royal shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0 text-center">
              {activePromotion.link ? (
                <Link
                  href={activePromotion.link}
                  className="text-sm font-medium text-white hover:text-blue-100 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm"
                >
                  {activePromotion.text}
                </Link>
              ) : (
                <span className="text-sm font-medium text-white">{activePromotion.text}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={t.banner.close}
              className="p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 shrink-0 transition-colors"
            >
              <X className="w-4 h-4 text-white/80 hover:text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
