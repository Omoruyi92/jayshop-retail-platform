'use client'
import Link from 'next/link'
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, Clock, Receipt, HelpCircle } from 'lucide-react'

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-jays-ice to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-jays-navy via-[#1a4480] to-jays-royal text-white">
        <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 sm:pt-24 sm:pb-10">
          <Link href="/" className="inline-flex items-center gap-1 text-blue-200/70 hover:text-white text-xs mb-4 transition-colors">
            <ChevronLeft size={14} /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <RotateCcw size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide">60-Day Return Policy</h1>
              <p className="text-blue-200/80 text-sm mt-1">Hassle-free returns within 60 days of purchase</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Overview banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-display font-bold text-green-800 text-sm uppercase tracking-wide mb-1">Our Promise</p>
              <p className="text-sm text-green-700 leading-relaxed">
                We want every fan to be 100% satisfied with their purchase. If you&apos;re not completely happy, 
                you may return or exchange eligible items within <strong>60 days</strong> of the original purchase date.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Eligible */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <h2 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide">Eligible for Return</h2>
            </div>
            <ul className="space-y-2">
              {[
                'Unworn, unwashed apparel with original tags attached',
                'Headwear in original condition with stickers and tags intact',
                'Accessories and novelty items in unopened packaging',
                'Defective or damaged merchandise (no time limit)',
                'Incorrect items received from hold orders',
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Not eligible */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle size={16} className="text-red-500" />
              </div>
              <h2 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide">Not Eligible</h2>
            </div>
            <ul className="space-y-2">
              {[
                'Worn, washed, or altered merchandise',
                'Items without original tags or packaging',
                'Clearance or final sale items',
                'Customized or personalized products',
                'Gift cards and digital products',
                'Items purchased more than 60 days ago',
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* How to return */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mt-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-jays-navy/5 flex items-center justify-center">
              <Receipt size={16} className="text-jays-navy" />
            </div>
            <h2 className="font-display font-bold text-jays-navy text-sm uppercase tracking-wide">How to Return</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Bring Your Receipt', desc: 'Original receipt or hold confirmation QR code is required for all returns and exchanges.' },
              { step: '2', title: 'Visit Gate 5 Store', desc: 'Bring the item to Jays Shop at Gate 5 (Section 110), Rogers Centre, during store hours.' },
              { step: '3', title: 'Get Your Refund', desc: 'Refunds are issued to the original payment method within 5–7 business days. Exchanges are immediate.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-jays-royal text-white font-display font-bold text-sm flex items-center justify-center mx-auto mb-2">{s.step}</div>
                <p className="font-display font-bold text-jays-navy text-xs uppercase tracking-wide mb-1">{s.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional info */}
        <div className="grid sm:grid-cols-2 gap-5 mt-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Clock size={16} className="text-jays-navy" />
              <h3 className="font-display font-bold text-jays-navy text-xs uppercase tracking-wide">Processing Time</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li>• Credit/Debit refunds: 5–7 business days</li>
              <li>• Apple Pay/Google Pay refunds: 5–7 business days</li>
              <li>• Exchanges: Immediate, subject to availability</li>
              <li>• Defective items: Priority processing within 48 hours</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <HelpCircle size={16} className="text-jays-navy" />
              <h3 className="font-display font-bold text-jays-navy text-xs uppercase tracking-wide">Need Help?</h3>
            </div>
            <div className="text-sm text-gray-700 space-y-1.5">
              <p>For return inquiries, contact us:</p>
              <p>• Phone: <a href="tel:+14163412904" className="text-jays-royal hover:underline">416.341.2904</a> (Gate 5)</p>
              <p>• Visit: Jays Shop, 1 Blue Jays Way, Toronto</p>
              <p>• Hours: 10:00 AM – 5:00 PM</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">Last updated: July 2026</p>
          <Link href="/policy" className="text-xs text-jays-royal hover:underline mt-1 inline-block">View Store Policy</Link>
        </div>
      </div>
    </div>
  )
}
