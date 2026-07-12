'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function SupportPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-b from-jays-navy via-jays-royal to-jays-navy text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wider">Support</h1>
          </div>
          <p className="text-blue-300 text-sm max-w-md mx-auto">
            We&apos;re here to help — browse the options below or reach out directly.
          </p>
        </div>

        <div className="space-y-3">
          {/* Online Holds */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">Online Holds</p>
              <p className="text-sm text-blue-300/80 mt-0.5">
                Reserve items online and pick up in-store. 48-hour hold at Gate 5 Store (Section 110) or 3-hour priority pickup.
              </p>
              <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 mt-2 transition-colors">
                Browse &amp; Reserve
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>

          {/* Gift Cards */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">Gift Cards</p>
              <p className="text-sm text-blue-300/80 mt-0.5">
                Available in-store at Gate 5 Store (Section 110). Perfect for any Blue Jays fan.
              </p>
            </div>
          </div>

          {/* Online Customer Service */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-white">Online Customer Service</p>
                <p className="text-sm text-blue-300/80 mt-0.5">We&apos;re here to help with any questions about your order.</p>
              </div>
            </div>
            {/* Email link */}
            <a
              href="mailto:jaysshopstaff@bluejays.com"
              className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
            >
              <svg className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-blue-200 group-hover:text-white transition-colors">Send us an email — jaysshopstaff@bluejays.com</span>
            </a>
            {/* Contact form */}
            {!sent ? (
              <form
                className="mt-3 space-y-2.5"
                onSubmit={(e) => { e.preventDefault(); setSent(true) }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text" placeholder="Your name" value={contactForm.name}
                    onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))} required
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm text-white placeholder-blue-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400/30"
                  />
                  <input
                    type="email" placeholder="Your email" value={contactForm.email}
                    onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))} required
                    className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm text-white placeholder-blue-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400/30"
                  />
                </div>
                <textarea
                  placeholder="How can we help?" rows={3} value={contactForm.message}
                  onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))} required
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm text-white placeholder-blue-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 focus:border-cyan-400/30 resize-none"
                />
                <button type="submit"
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold uppercase tracking-wider hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                  Send Message
                </button>
              </form>
            ) : (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-emerald-500/20 border border-emerald-400/20">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-emerald-300 font-medium">Thank you! We&apos;ll get back to you soon.</p>
              </div>
            )}
          </div>

          {/* Physical Store */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-white">Physical Store</p>
                <p className="text-sm text-blue-300/80 mt-0.5">1 Blue Jays Way, Toronto, ON M5V 1J4</p>
                <p className="text-xs text-blue-300/60">Gate 5 Store — Section 110 · Rogers Centre</p>
              </div>
            </div>
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/10">
              <Image
                src="/brand/store-front.jpg"
                alt="Jays Shop Store Front at Rogers Centre"
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 100vw, 700px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              <div className="absolute bottom-2 left-3">
                <p className="text-[11px] font-bold text-white uppercase tracking-wider drop-shadow">Jays Shop — Rogers Centre</p>
              </div>
            </div>
          </div>

          {/* Product Availability & New Arrivals */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-400/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">Product Availability &amp; New Arrivals</p>
              <p className="text-sm text-blue-300/80 mt-0.5">
                Check real-time stock levels across all stadium locations. New arrivals are updated frequently — browse the latest drops in our New Arrivals section.
              </p>
              <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 mt-2 transition-colors">
                Check Availability
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link href="/shop" className="text-sm text-blue-300 hover:text-white transition-colors">
            &larr; Back to Shop
          </Link>
        </div>
      </div>
    </main>
  )
}
