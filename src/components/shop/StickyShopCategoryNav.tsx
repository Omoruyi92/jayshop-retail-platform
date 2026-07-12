import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const CATEGORY_ORDER = [
  'Men',
  'Women',
  'Kids',
  'Sports',
  'Jerseys',
  'Hats',
  'Casuals',
  'Accessories',
  'Authentication',
  'Blank Jersey',
  'Featured',
  'New Arrivals',
  'Sales & Clearance',
]

export default async function StickyShopCategoryNav({ activeCategory }: { activeCategory?: string }) {
  const products = await prisma.product.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: { category: true, subcategory: true, name: true },
  })

  const categories = new Set<string>()
  for (const p of products) {
    if (p.category) categories.add(p.category)
  }
  const availableCategories = CATEGORY_ORDER.filter((cat) => categories.has(cat))

  return (
    <div className="sticky top-14 sm:top-[5.5rem] xl:top-14 z-20 bg-jays-ice/95 backdrop-blur border-y border-gray-200/60">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {availableCategories.map((cat) => (
            <Link
              key={cat}
              href={`/shop?category=${encodeURIComponent(cat)}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-display font-semibold uppercase tracking-wide transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-jays-navy to-jays-royal text-white shadow-md shadow-jays-navy/20'
                  : 'bg-white/90 text-jays-navy border border-jays-navy/12 hover:border-jays-navy/30 hover:bg-white hover:shadow-sm'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
