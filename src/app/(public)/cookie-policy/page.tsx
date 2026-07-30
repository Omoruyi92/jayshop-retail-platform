'use client'
import Link from 'next/link'
import { Cookie, ChevronLeft } from 'lucide-react'

export default function CookiePolicyPage() {
  const items = [
    'Jays Shop uses cookies and similar technologies (such as localStorage) to make our website work and to improve your experience.',
    'Essential cookies are required for core functionality — keeping your cart, holds, language preference, and consent choice — and cannot be disabled.',
    'A first-party consent cookie (jays_consent) records that you have accepted our policies so we do not ask you again on every visit. It expires after 12 months.',
    'Performance cookies help us understand how visitors use the site (pages visited, load times) in aggregate, anonymized form so we can improve our services.',
    'We do not use third-party advertising or cross-site tracking cookies. Your browsing on Jays Shop is not sold to or shared with advertisers.',
    'Your language preference and recently viewed products are stored locally on your device to personalize your visit.',
    'You can clear cookies and site data at any time through your browser settings. Doing so will reset your preferences and you will be asked to accept our policies again.',
    'For questions about how we use cookies, contact us at Gate 5: 416.341.2904.',
  ]

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
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
                <span className="text-jays-royal mt-1 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">Last updated: July 2026</p>
          <Link href="/privacy" className="text-xs text-jays-royal hover:underline mt-1 inline-block">View Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
