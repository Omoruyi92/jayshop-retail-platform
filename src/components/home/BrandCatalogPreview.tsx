import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getBrandProductCounts } from '@/lib/brands'

const PREVIEW_COUNT = 8

/**
 * Homepage preview of the /brands catalog — pulls from the same Brand model
 * / product-count helper used by the full brands index page, so counts never
 * drift between the two. Shows the brands with the most live products first
 * (most useful entry point for shoppers), capped to a tidy grid with a
 * "View All Brands" link through to the full page. Read-only preview; the
 * full /brands page and its data/links are untouched.
 */
export default async function BrandCatalogPreview() {
  const brandRows = await prisma.brand.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  })

  if (brandRows.length === 0) return null

  const counts = await getBrandProductCounts(brandRows.map((b) => b.name))
  const brands = brandRows
    .map((b, i) => ({ ...b, productCount: counts[i] }))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, PREVIEW_COUNT)

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-display font-bold uppercase tracking-[0.25em] text-jays-red">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jays-red" />
              Shop by Brand
            </span>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-jays-navy sm:text-4xl">
              Top Brands
            </h2>
            <p className="mt-2 max-w-lg text-sm text-jays-steel sm:text-base">
              Official gear from the labels fans trust most.
            </p>
          </div>
          <Link
            href="/brands"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-jays-navy transition-colors hover:text-jays-red"
          >
            View All Brands
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-5 lg:grid-cols-8">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group flex flex-col items-center text-center"
            >
              <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-2xl bg-jays-ice/60 p-4 ring-1 ring-black/[0.03] transition-all duration-300 group-hover:bg-white group-hover:shadow-md group-hover:ring-jays-navy/10">
                {brand.imageUrl ? (
                  <Image
                    src={brand.imageUrl}
                    alt={brand.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, 12vw"
                  />
                ) : (
                  <span className="font-display text-2xl font-bold text-jays-navy">{brand.name.charAt(0)}</span>
                )}
              </div>
              <span className="truncate text-xs font-semibold uppercase tracking-wide text-jays-navy sm:text-sm">
                {brand.name}
              </span>
              <span className="mt-0.5 text-[11px] text-jays-steel">
                {brand.productCount} product{brand.productCount === 1 ? '' : 's'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
