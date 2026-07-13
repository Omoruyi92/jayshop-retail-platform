import type { Metadata } from 'next'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import Header from '@/components/layout/Header'
import SubNavBar from '@/components/layout/SubNavBar'
import Footer from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import ChatFAB from '@/components/chat/ChatFAB'
import FeedbackTab from '@/components/feedback/FeedbackTab'
import PromotionBanner from '@/components/layout/PromotionBanner'
import { CartProvider, FavoritesProvider } from '@/lib/store'

export const metadata: Metadata = {
  title: {
    default: 'Jays Shop — Reserve Blue Jays Merchandise',
    template: '%s | Jays Shop',
  },
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <FavoritesProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <PromotionBanner />
            <Header />
            <SubNavBar />
            <main className="flex-1 pb-24 sm:pb-0">{children}</main>
            <Footer />
            <BottomNav />
            <ChatFAB />
            <FeedbackTab />
          </div>
        </CartProvider>
      </FavoritesProvider>
    </LanguageProvider>
  )
}
