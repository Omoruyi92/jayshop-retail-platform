'use client'

import Link from 'next/link'

const DISCOUNTS = [
  { group: 'Blue Jays / Jays Staff', pct: 30, color: 'from-blue-500 to-cyan-500', icon: '⚾' },
  { group: 'Legends Staff', pct: 20, color: 'from-amber-500 to-orange-500', icon: '⭐' },
  { group: 'Military', pct: 20, color: 'from-emerald-500 to-green-500', icon: '🎖️' },
  { group: 'Junior Jays (Youth)', pct: 20, color: 'from-sky-500 to-blue-500', icon: '🧢' },
  { group: 'Tour', pct: 10, color: 'from-violet-500 to-purple-500', icon: '🎫' },
  { group: 'Damages', pct: 15, color: 'from-red-500 to-rose-500', icon: '🏷️' },
]

export default function DiscountsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-jays-navy via-jays-royal to-jays-navy text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wider">Discounts</h1>
          </div>
          <p className="text-blue-300 text-sm max-w-md mx-auto">
            The following discounts are available exclusively for <span className="text-white font-semibold">in-store walk-in (POS) sales</span> at the Jays Shop, Rogers Centre.
          </p>
        </div>

        {/* Discount cards */}
        <div className="space-y-3 mb-8">
          {DISCOUNTS.map((d) => (
            <div key={d.group} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
              <div className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${d.color} flex items-center justify-center shadow-lg`}>
                <span className="text-2xl font-display font-black text-white">{d.pct}%</span>
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-white flex items-center gap-2">
                  <span>{d.icon}</span> {d.group}
                </p>
                <p className="text-xs text-blue-300/80 mt-0.5">
                  {d.group === 'Junior Jays (Youth)'
                    ? `${d.pct}% off all youth merchandise — valid on Jr. Jays Sundays at point of sale`
                    : `${d.pct}% off all eligible merchandise — valid with ID at point of sale`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Policy notes */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-8">
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Important Notes
          </h2>
          <ul className="space-y-1.5 text-xs text-blue-300/80">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              Discounts apply only to in-store purchases at the Jays Shop (Gate 5, Section 110).
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              Valid identification or staff credentials must be presented at checkout.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              Discounts cannot be combined with other promotions or clearance items.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              Damage discounts are applied at management discretion based on product condition.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              Online holds and reservations are processed at full price; discounts applied at pickup.
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all">
            Visit In-Store
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </main>
  )
}
