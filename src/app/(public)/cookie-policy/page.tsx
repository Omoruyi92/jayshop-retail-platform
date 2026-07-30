'use client'
import Link from 'next/link'
import { Cookie, ChevronLeft } from 'lucide-react'
import CookiePolicyContent, { CookiePolicyDownloadLink } from '@/components/policies/CookiePolicyContent'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function CookiePolicyPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-b from-jays-ice to-white">
      <div className="bg-gradient-to-br from-jays-navy via-[#1a4480] to-jays-royal text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 sm:pt-24 sm:pb-10">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-200/70 hover:text-white text-xs mb-4 transition-colors">
            <ChevronLeft size={14} /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Cookie size={20} className="text-white" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide">Cookie Policy</h1>
          </div>
          <p className="text-blue-200/80 text-sm mt-2">How we use cookies and similar technologies on our website.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow">
          <CookiePolicyContent />
          <div className="mt-5 pt-4 border-t border-gray-100">
            <CookiePolicyDownloadLink label={t.consent.download} />
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">Last updated: July 2026</p>
          <Link href="/privacy" className="text-xs text-jays-royal hover:underline mt-1 inline-block">View Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
