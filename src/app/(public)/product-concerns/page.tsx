'use client'

import { useState } from 'react'
import Link from 'next/link'

const BRANDS = [
  { name: 'Nike', url: 'https://www.nike.com/help/a/product-safety', color: 'bg-white/10' },
  { name: 'New Era', url: 'https://www.neweracap.com/pages/customer-service', color: 'bg-white/10' },
  { name: 'Fanatics', url: 'https://www.fanatics.com/customer-help', color: 'bg-white/10' },
  { name: '47 Brand', url: 'https://www.47brand.com/pages/contact', color: 'bg-white/10' },
  { name: 'Mitchell & Ness', url: 'https://www.mitchellandness.com/customer-service', color: 'bg-white/10' },
  { name: 'Majestic', url: 'https://www.majesticathletic.com/contact-us', color: 'bg-white/10' },
]

export default function ProductConcernsPage() {
  const [form, setForm] = useState({ name: '', email: '', product: '', concern: '' })
  const [sent, setSent] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-b from-jays-navy via-jays-royal to-jays-navy text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wider">Product Concerns</h1>
          </div>
          <p className="text-blue-300 text-sm max-w-lg mx-auto">
            Your safety matters. If you have concerns about a product&apos;s quality, materials, or safety, please reach out to us or contact the brand directly.
          </p>
        </div>

        {/* Brand partners */}
        <section className="mb-8">
          <h2 className="text-base font-display font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-red-400 rounded-full" />
            Brand Partner Support
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BRANDS.map((b) => (
              <a
                key={b.name}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
              >
                <span className="text-sm font-semibold text-blue-200 group-hover:text-white transition-colors">{b.name}</span>
                <svg className="w-3.5 h-3.5 text-blue-300/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </section>

        {/* Common concerns */}
        <section className="mb-8">
          <h2 className="text-base font-display font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
            Common Concerns We Handle
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: 'Defective stitching or print', icon: '🧵' },
              { label: 'Sizing inconsistencies', icon: '📏' },
              { label: 'Color fading or bleeding', icon: '🎨' },
              { label: 'Broken zippers or hardware', icon: '🔩' },
              { label: 'Allergic material reactions', icon: '⚠️' },
              { label: 'Missing tags or labels', icon: '🏷️' },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-base">{c.icon}</span>
                <span className="text-xs text-blue-200">{c.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Report form */}
        <section className="mb-8">
          <h2 className="text-base font-display font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-400 rounded-full" />
            Report a Concern
          </h2>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            {!sent ? (
              <form className="space-y-2.5" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-xs text-white placeholder-blue-300/50 focus:outline-none focus:ring-1 focus:ring-red-400/50" />
                  <input type="email" placeholder="Your email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-xs text-white placeholder-blue-300/50 focus:outline-none focus:ring-1 focus:ring-red-400/50" />
                </div>
                <input type="text" placeholder="Product name or SKU" value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} required
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-xs text-white placeholder-blue-300/50 focus:outline-none focus:ring-1 focus:ring-red-400/50" />
                <textarea placeholder="Describe your concern..." rows={3} value={form.concern} onChange={e => setForm(f => ({ ...f, concern: e.target.value }))} required
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-xs text-white placeholder-blue-300/50 focus:outline-none focus:ring-1 focus:ring-red-400/50 resize-none" />
                <button type="submit" className="w-full py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold uppercase tracking-wider hover:from-red-400 hover:to-rose-400 transition-all">
                  Submit Report
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/20 border border-emerald-400/20">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-emerald-300 font-medium">Report submitted. Our team will review and contact you within 48 hours.</p>
              </div>
            )}
          </div>
        </section>

        <div className="text-center">
          <Link href="/shop" className="text-sm text-blue-300 hover:text-white transition-colors">
            &larr; Back to Shop
          </Link>
        </div>
      </div>
    </main>
  )
}
