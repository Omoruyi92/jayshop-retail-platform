'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Megaphone } from 'lucide-react'
import { usePromotions } from '@/lib/promotions/PromotionsContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'

/**
 * Dismissible promotion alert attached to the main navigation bar
 * (rendered inside SubNavBar so its height is included in the
 * --subnav-height CSS var and downstream sticky bars stack correctly).
 *
 * Renders NOTHING (null) when there is no active promotion — no reserved
 * height, no empty wrapper. The promotions list is seeded server-side via
 * PromotionsProvider, so when a promotion is active the banner is present
 * in the very first paint (no CLS pop-in).
 *
 * Dismissal is per-page-load, in-memory, keyed to the promotion id:
 * clicking X hides the banner for the rest of this page's lifetime
 * (including client-side route changes, since the public layout persists),
 * but a page refresh — or a newly published promotion with a different
 * id — brings it back. Intentionally NOT persisted to session/localStorage.
 */
export default function PromotionAlert() {
  const promotions = usePromotions()
  const { t } = useLanguage()
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  // The list is already sorted by priority desc, then createdAt desc.
  const activePromotion = promotions[0]
  if (!activePromotion || activePromotion.id === dismissedId) return null

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissedId(activePromotion.id)
  }

  return (
    <div
      className="bg-jays-navy text-white border-b border-white/10"
      data-testid="promotion-alert-banner"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-3">
        <Megaphone className="w-4 h-4 text-blue-300 shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0 text-center">
          {activePromotion.link ? (
            <Link
              href={activePromotion.link}
              className="text-xs sm:text-sm font-medium text-white hover:text-blue-100 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm"
            >
              {activePromotion.text}
            </Link>
          ) : (
            <span className="text-xs sm:text-sm font-medium text-white">{activePromotion.text}</span>
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
  )
}
