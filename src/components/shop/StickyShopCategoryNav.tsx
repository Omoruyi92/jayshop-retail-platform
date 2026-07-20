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
    select: {
      category: true,
      isFeatured: true,
      isNewArrival: true,
      isClearance: true,
      isBlankJersey: true,
      salePriceCents: true,
    },
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
    if (p.isClearance || (p.salePriceCents ?? 0) > 0) hasClearance = true
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(19,74,142,0.8) 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto no-scrollbar">
            {pills.map(({ label, value }) => {
              const active = activeCategory?.toLowerCase() === value.toLowerCase()
              return (
                <Link
                  key={value}
                  href={`/shop?category=${encodeURIComponent(value)}`}
                  className={`
                    shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all
                    ${active
                      ? 'bg-jays-navy text-white shadow-sm'
                      : 'bg-white text-jays-navy border border-jays-navy/10 hover:border-jays-navy/30 hover:bg-jays-ice/50'}
                  `}
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
