import { Star } from 'lucide-react'

export default function FeaturedProductsBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-jays-navy via-jays-royal to-jays-navy text-white shadow-xl ring-1 ring-black/5">
        {/* subtle dotted texture, matches the sticky category nav / category banner treatment */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-12 -bottom-24 h-64 w-64 rounded-full bg-jays-red/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg shadow-black/10 sm:flex">
              <Star className="h-6 w-6" />
            </span>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Game Day Picks
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl">
                Featured Products
              </h2>
              <p className="mt-2 max-w-xl text-sm opacity-85 sm:text-base">
                Top picks from the Jays Shop team.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-display font-semibold uppercase tracking-wide shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            View Featured
          </span>
        </div>
      </div>
    </section>
  )
}
