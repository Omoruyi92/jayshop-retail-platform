import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/shop/ProductCard'
import { getProductAvailability } from '@/lib/inventory/aggregate'
import { notFound } from 'next/navigation'
import PaginationControls from '@/components/ui/PaginationControls'

export const revalidate = 60

const PRODUCTS_PER_PAGE = 30

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
  })
  return brands.map((brand) => ({ slug: brand.slug }))
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { page?: string }
}) {
  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug, status: 'ACTIVE' },
  })
  if (!brand) notFound()

  const products = await prisma.product.findMany({
    where: { status: { not: 'ARCHIVED' }, brand: { equals: brand.name.trim(), mode: 'insensitive' } },
    orderBy: [{ createdAt: 'desc' }],
  })

  const cards = await Promise.all(
    products.map(async (product) => {
      const availability = await getProductAvailability(product.id)
      return { product, availability }
    })
  )

  const currentPage = Math.max(1, Number(searchParams.page ?? '1') || 1)
  const totalPages = Math.max(1, Math.ceil(cards.length / PRODUCTS_PER_PAGE))
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE
  const pageCards = cards.slice(start, start + PRODUCTS_PER_PAGE)

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/brands" className="text-sm text-jays-steel hover:text-jays-navy">Brands</Link>
        <span className="text-jays-steel">/</span>
        <span className="text-sm font-semibold text-jays-navy">{brand.name}</span>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-jays-navy via-jays-royal to-jays-navy p-6 sm:p-10 mb-8 text-white">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px',
        }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          {brand.imageUrl ? (
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-2xl p-3 shrink-0 flex items-center justify-center">
              <Image src={brand.imageUrl} alt={brand.name} fill className="object-contain p-3" sizes="144px" />
            </div>
          ) : (
            <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white/10 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0">
              {brand.name.charAt(0)}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-wide mb-2">{brand.name}</h1>
            <p className="text-blue-200 text-sm sm:text-base">
              {products.length} product{products.length === 1 ? '' : 's'} available
            </p>
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-12 text-jays-steel">No products found for {brand.name}.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {pageCards.map(({ product, availability }) => (
              <ProductCard
                key={product.id}
                product={product}
                remaining={availability.availableBalance}
              />
            ))}
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={cards.length}
            baseUrl={`/brands/${params.slug}`}
          />
        </>
      )}
    </div>
  )
}
