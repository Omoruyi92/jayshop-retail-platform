'use client'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import MLBLogo from '@/components/ui/MLBLogo'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-jays-royal text-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <p className="font-display font-bold text-lg uppercase tracking-wider">
              <span className="text-jays-red">Jays</span> Shop
            </p>
            <p className="text-blue-300 text-xs mt-1">
              {t.footer.tagline}
            </p>
            <p className="text-blue-300 text-xs mt-1 font-medium">
              {t.footer.storeHours}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2">
              <MLBLogo size={36} className="opacity-90" />
              <span className="text-blue-300 text-xs">Official MLB Licensed Retailer</span>
            </div>
          </div>

          {/* Links */}
          <nav className="flex gap-6 text-sm text-blue-200">
            <Link href="/shop"    className="hover:text-white transition-colors">{t.footer.shop}</Link>
            <Link href="/my-holds" className="hover:text-white transition-colors">{t.footer.myHolds}</Link>
            <Link href="/admin"   className="hover:text-white transition-colors">{t.footer.staffLogin}</Link>
          </nav>
        </div>

        <div className="border-t border-blue-700 mt-6 pt-4 text-center text-xs text-blue-400">
          &copy; {new Date().getFullYear()} Jays Shop. {t.footer.copyright}
        </div>
      </div>
    </footer>
  )
}
