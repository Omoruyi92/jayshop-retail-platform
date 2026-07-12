'use client'
import Link from 'next/link'
import { ChevronLeft, Lock } from 'lucide-react'

export default function PrivacyPage() {
  const items = [
    'Jays Shop respects your privacy and is committed to protecting your personal information in compliance with the Personal Information Protection and Electronic Documents Act (PIPEDA).',
    'We collect only the information necessary to process holds, reservations, and provide customer service — such as name, email, and phone number.',
    'Your personal data is never sold, rented, or shared with third parties for marketing purposes without your explicit consent.',
    'Hold and reservation data (including QR codes) is stored securely and automatically purged after the hold period expires.',
    'Analytics data is collected in aggregate and anonymized form to improve our services and product offerings.',
    'You may request access to, correction of, or deletion of your personal data at any time by contacting us at 416.341.2904.',
    'Cookies are used on our website for essential functionality and performance monitoring. No tracking cookies are used without consent.',
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
              <Lock size={20} className="text-white" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide">Privacy Policy</h1>
          </div>
          <p className="text-blue-200/80 text-sm mt-2">How we collect, use, and protect your personal information.</p>
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
          <Link href="/policy" className="text-xs text-jays-royal hover:underline mt-1 inline-block">View Store Policy</Link>
        </div>
      </div>
    </div>
  )
}
