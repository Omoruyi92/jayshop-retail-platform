import type { Metadata } from 'next'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import Header from '@/components/layout/Header'
import SubNavBar from '@/components/layout/SubNavBar'
import Footer from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import ChatFAB from '@/components/chat/ChatFAB'
import FeedbackTab from '@/components/feedback/FeedbackTab'
import RecentlyViewedPopup from '@/components/shop/RecentlyViewedPopup'
import CookieConsentModal from '@/components/layout/CookieConsentModal'
import { CartProvider, FavoritesProvider } from '@/lib/store'
import { SearchProvider } from '@/lib/store/SearchContext'
import { PromotionsProvider, type Promotion } from '@/lib/promotions/PromotionsContext'
import { prisma } from '@/lib/prisma'
import { isDbConnectionError } from '@/lib/db-error'

export const metadata: Metadata = {
  title: {
    default: 'Jays Shop — Reserve Blue Jays Merchandise',
    template: '%s | Jays Shop',
  },
}

/**
 * Fetches the same active-promotions set as `/api/promotions`, but directly
 * in the server component so `PromotionsProvider` can be seeded before first
 * paint — the shared promotions state consumed by the dismissible
 * `PromotionAlert` banner (rendered inside `SubNavBar`). Falls back to `[]`
 * on DB hiccups — identical to the API route's own fallback — rather than
 * failing the page.
 */
async function getActivePromotions(): Promise<Promotion[]> {
  try {
    const now = new Date()
    return await prisma.promotionMessage.findMany({
      where: {
        status: 'APPROVED',
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, text: true, link: true, priority: true },
    })
  } catch (err) {
    if (!isDbConnectionError(err)) console.error('getActivePromotions', err)
    return []
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const initialPromotions = await getActivePromotions()

  return (
    <LanguageProvider>
      <SearchProvider>
      <FavoritesProvider>
        <CartProvider>
          <PromotionsProvider initialPromotions={initialPromotions}>
            <div className="min-h-screen flex flex-col">
              <Header />
              <SubNavBar />
              <main className="flex-1 pb-24 sm:pb-0">{children}</main>
              <Footer />
              <BottomNav />
              <ChatFAB />
              <FeedbackTab />
              <RecentlyViewedPopup />
              <CookieConsentModal />
            </div>
          </PromotionsProvider>
        </CartProvider>
      </FavoritesProvider>
      </SearchProvider>
    </LanguageProvider>
  )
}
