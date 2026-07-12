'use client'

import Link from 'next/link'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const

const CHEST = { XS: '32-34', S: '35-37', M: '38-40', L: '41-43', XL: '44-46', '2XL': '48-50', '3XL': '52-54' }
const WAIST = { XS: '26-28', S: '29-31', M: '32-34', L: '35-37', XL: '38-40', '2XL': '42-44', '3XL': '46-48' }

export default function SizeChartPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-jays-navy via-jays-royal to-jays-navy text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wider">Size Chart</h1>
          </div>
          <p className="text-blue-300 text-sm">Official sizing guide for Blue Jays apparel — jerseys, fleece, t-shirts & more</p>
        </div>

        {/* Men's / Unisex */}
        <section className="mb-6">
          <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-cyan-400 rounded-full" />
            Men&apos;s / Unisex
          </h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10">
                  <th className="text-left px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Size</th>
                  <th className="text-center px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Chest (in)</th>
                  <th className="text-center px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Waist (in)</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((s, i) => (
                  <tr key={s} className={i % 2 === 0 ? 'bg-white/[0.03]' : 'bg-white/[0.06]'}>
                    <td className="px-3 py-2 font-semibold text-white">{s}</td>
                    <td className="px-3 py-2 text-center text-blue-200">{CHEST[s]}</td>
                    <td className="px-3 py-2 text-center text-blue-200">{WAIST[s]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Women's */}
        <section className="mb-6">
          <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-pink-400 rounded-full" />
            Women&apos;s
          </h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10">
                  <th className="text-left px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Size</th>
                  <th className="text-center px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Bust (in)</th>
                  <th className="text-center px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Waist (in)</th>
                </tr>
              </thead>
              <tbody>
                {(['XS', 'S', 'M', 'L', 'XL', '2XL'] as const).map((s, i) => (
                  <tr key={s} className={i % 2 === 0 ? 'bg-white/[0.03]' : 'bg-white/[0.06]'}>
                    <td className="px-3 py-2 font-semibold text-white">{s}</td>
                    <td className="px-3 py-2 text-center text-blue-200">
                      {{ XS: '30-32', S: '33-35', M: '36-38', L: '39-41', XL: '42-44', '2XL': '46-48' }[s]}
                    </td>
                    <td className="px-3 py-2 text-center text-blue-200">
                      {{ XS: '24-26', S: '27-29', M: '30-32', L: '33-35', XL: '36-38', '2XL': '40-42' }[s]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Kids */}
        <section className="mb-6">
          <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-400 rounded-full" />
            Kids / Youth
          </h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10">
                  <th className="text-left px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Size</th>
                  <th className="text-center px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Age</th>
                  <th className="text-center px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Chest (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'Infant', age: '0-12 months', chest: '17-19' },
                  { size: 'Toddler', age: '2T-4T', chest: '19-22' },
                  { size: 'Child', age: '5-7 years', chest: '22-25' },
                  { size: 'Child Youth', age: '8-14 years', chest: '26-31' },
                  { size: 'Youth', age: '15-18 years', chest: '32-34' },
                ].map((r, i) => (
                  <tr key={r.size} className={i % 2 === 0 ? 'bg-white/[0.03]' : 'bg-white/[0.06]'}>
                    <td className="px-3 py-2 font-semibold text-white">{r.size}</td>
                    <td className="px-3 py-2 text-center text-blue-200">{r.age}</td>
                    <td className="px-3 py-2 text-center text-blue-200">{r.chest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Hat sizing */}
        <section className="mb-8">
          <h2 className="text-lg font-display font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-400 rounded-full" />
            Hat Sizing
          </h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/10">
                  <th className="text-left px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Fitted Size</th>
                  <th className="text-center px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Head Circ. (in)</th>
                  <th className="text-center px-3 py-2 text-blue-300 font-medium text-xs uppercase tracking-wider">Head Circ. (cm)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: '6⅞', inch: '21⅝', cm: '54.9' },
                  { size: '7', inch: '22', cm: '55.9' },
                  { size: '7⅛', inch: '22⅜', cm: '56.8' },
                  { size: '7¼', inch: '22¾', cm: '57.8' },
                  { size: '7⅜', inch: '23⅛', cm: '58.7' },
                  { size: '7½', inch: '23½', cm: '59.7' },
                  { size: '7⅝', inch: '23⅞', cm: '60.6' },
                  { size: '7¾', inch: '24¼', cm: '61.6' },
                  { size: '8', inch: '25', cm: '63.5' },
                ].map((r, i) => (
                  <tr key={r.size} className={i % 2 === 0 ? 'bg-white/[0.03]' : 'bg-white/[0.06]'}>
                    <td className="px-3 py-2 font-semibold text-white">{r.size}</td>
                    <td className="px-3 py-2 text-center text-blue-200">{r.inch}</td>
                    <td className="px-3 py-2 text-center text-blue-200">{r.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-blue-300/60 mt-2">Adjustable / snapback hats are one-size-fits-most. Flex-fit hats come in S/M and L/XL.</p>
        </section>

        <div className="text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold uppercase tracking-wider hover:from-cyan-400 hover:to-blue-400 transition-all">
            Shop Now
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    </main>
  )
}
