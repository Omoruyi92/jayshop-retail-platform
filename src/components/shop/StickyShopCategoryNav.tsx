import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const CATEGORY_LABELS: Record<string, string> = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  accessories: 'Accessories',
  authentication: 'Authentication',
  sports: 'Sports',
}

const CATEGORY_SORT_ORDER = ['men', 'women', 'kids', 'accessories', 'sports', 'authentication']

export default async function StickyShopCategoryNav({ activeCategory }: { activeCategory?: string }) {
  const products = await prisma.product.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: { category: true, isFeatured: true, isNewArrival: true, isClearance: true, isBlankJersey: true, salePriceCents: true },
  })

  const categorySet = new Set<string>()
  let hasFeatured = false
  let hasNewArrival = false
  let hasClearance = false
  let hasBlanks = false
  for (const p of products) {
    if (p.category) categorySet.add(p.category.toLowerCase())
    if (p.isFeatured) hasFeatured = true
    if (p.isNewArrival) hasNewArrival = true
    if (p.isClearance || p.salePriceCents > 0) hasClearance = true
    if (p.isBlankJersey) hasBlanks = true
  }

  const realCategories = Array.from(categorySet).sort((a, b) => {
    const ai = CATEGORY_SORT_ORDER.indexOf(a)
    const bi = CATEGORY_SORT_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  const pills: { label: string; value: string }[] = [
    { label: 'All', value: 'All' },
    ...realCategories.map((c) => ({ label: CATEGORY_LABELS[c] ?? c.charAt(0).toUpperCase() + c.slice(1), value: c })),
    ...(hasFeatured ? [{ label: 'Featured', value: 'Featured' }] : []),
    ...(hasNewArrival ? [{ label: 'New Arrivals', value: 'New Arrivals' }] : []),
    ...(hasClearance ? [{ label: 'Sales & Clearance', value: 'Sales & Clearance' }] : []),
    ...(hasBlanks ? [{ label: 'Blanks', value: 'Blanks' }] : []),
  ]

  return (
    <div
      className="sticky z-20"
      style={{ top: 'calc(var(--header-height, 3.5rem) + var(--subnav-height, 2.75rem))' }}
    >
      <div className="relative overflow-hidden border-y border-jays-navy/10 bg-gradient-to-b from-white via-white to-jays-ice/70 shadow-[0_1px_0_rgba(19,74,142,0.06)] backdrop-blur-md">
        {/* subtle dotted pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #134A8E 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        />
        {/* soft brand-color glows for a premium feel */}
        <div aria-hidden className="pointer-events-none absolute -left-10 -top-16 h-32 w-32 rounded-full bg-jays-royal/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 h-32 w-32 rounded-full bg-jays-red/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6">
          <div className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto scroll-px-3 pb-0.5 scrollbar-hide [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] sm:[mask-image:none]">
            {pills.map(({ label, value }) => {
              const isActive = (activeCategory ?? 'All') === value
              return (
                <Link
                  key={value}
                  href={value === 'All' ? '/shop?category=All' : `/shop?category=${encodeURIComponent(value)}`}
                  scroll={false}
                  className={`shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2 text-[11px] font-display font-semibold uppercase tracking-wide transition-all duration-300 ease-out sm:px-5 sm:text-xs ${
                    isActive
                      ? 'scale-[1.04] bg-gradient-to-r from-jays-navy to-jays-royal text-white shadow-lg shadow-jays-navy/25'
                      : 'border border-jays-navy/12 bg-white text-jays-navy shadow-sm hover:-translate-y-0.5 hover:border-jays-navy/25 hover:bg-jays-ice/70 hover:shadow-md'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
