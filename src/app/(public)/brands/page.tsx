import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getBrandProductCounts } from '@/lib/brands'

export const revalidate = 60

export default async function BrandsIndexPage() {
  const brandRows = await prisma.brand.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  })
  const counts = await getBrandProductCounts(brandRows.map((b) => b.name))
  const brands = brandRows.map((b, i) => ({ ...b, productCount: counts[i] }))

  if (brands.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-jays-navy uppercase tracking-wide mb-2">
            Shop by Brand
          </h1>
          <p className="text-jays-steel">No brands available right now.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-jays-navy uppercase tracking-wide mb-2">
        Shop by Brand
      </h1>
      <p className="text-jays-steel mb-6 sm:mb-8">
        Browse official Blue Jays merchandise by your favourite brands.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="group flex flex-col items-center text-center bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <div className="relative w-full aspect-[3/2] mb-3 flex items-center justify-center">
              {brand.imageUrl ? (
                <Image
                  src={brand.imageUrl}
                  alt={brand.name}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : (
                <span className="text-3xl font-display font-bold text-jays-navy">{brand.name.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-jays-navy uppercase tracking-wide">{brand.name}</span>
            <span className="text-[11px] text-jays-steel mt-1">
              {brand.productCount} product{brand.productCount === 1 ? '' : 's'}
            </span>
          </Link>
        ))}
      </div>
      </div>
    </div>
  )
}
