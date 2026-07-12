'use client'
import Link from 'next/link'
import { ChevronLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  const items = [
    'By using Jays Shop services (in-store or online), you agree to these terms and conditions.',
    'All purchases are subject to product availability. Jays Shop reserves the right to cancel orders if items are unavailable.',
    'Customers must be 18 years of age or older to make purchases, or accompanied by a parent or guardian.',
    'Jays Shop is not liable for delays, cancellations, or modifications caused by circumstances beyond our control, including game-day disruptions or venue closures.',
    'Reproduction, resale, or redistribution of Jays Shop merchandise for commercial purposes without authorization is prohibited.',
    'Hold reservations constitute a temporary commitment and do not guarantee purchase. Unclaimed holds are released automatically.',
    'These terms are governed by the laws of the Province of Ontario and the federal laws of Canada.',
    'Jays Shop reserves the right to refuse service to any individual who violates store policies or behaves in a disruptive manner.',
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
              <FileText size={20} className="text-white" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide">Terms &amp; Conditions</h1>
          </div>
          <p className="text-blue-200/80 text-sm mt-2">The rules and guidelines for using Jays Shop services.</p>
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
