import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { buildManyAvailability } from '@/lib/inventory/aggregate'
import { getMainStoreLocationId } from '@/lib/store-locations'
import { getSubPriorityMap } from '@/lib/categories'
import { titleCase } from '@/lib/text'
import ProductCarousel from '@/components/shop/ProductCarousel'

export const revalidate = 60

const FALLBACK_PRIORITY = 999

function normalizeProductType(product: { productType?: string | null; subcategory?: string | null }): string {
  return (product.productType || product.subcategory || '').toLowerCase()
}

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
  })
  return brands.map((brand) => ({ slug: brand.slug }))
}

export default async function BrandPage({
  params,
}: {
  params: { slug: string }
}) {
  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug, status: 'ACTIVE' },
  })
  if (!brand) notFound()

  const products = await prisma.product.findMany({
    where: { status: { not: 'ARCHIVED' }, brand: { equals: brand.name.trim(), mode: 'insensitive' } },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      sizeInventories: {
        select: {
          size: true,
          quantity: true,
          heldQuantity: true,
          pickedQuantity: true,
          location: {
            select: {
              id: true,
              name: true,
              section: true,
              gate: true,
              isMainStore: true,
              isPickupQueue: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  })

  // Batch-compute availability for every product in one pass (same approach
  // as /api/products) instead of the previous N+1 `getProductAvailability`
  // call per product.
  const mainStoreLocationId = await getMainStoreLocationId()
  const sizeInventoryRows = products.flatMap((p) =>
    p.sizeInventories.map((s) => ({ ...s, productId: p.id }))
  )
  const availabilityMap = buildManyAvailability(products, sizeInventoryRows, mainStoreLocationId)

  const cards = products.map((product) => {
    const hasSizes = product.sizeInventories.length > 0
    const remaining = hasSizes
      ? product.sizeInventories.reduce((sum, s) => sum + Math.max(0, s.quantity - s.heldQuantity - s.pickedQuantity), 0)
      : Math.max(0, product.quantity - product.heldQuantity - product.pickedQuantity)
    const allSizesOos =
      hasSizes && product.sizeInventories.every((s) => s.quantity - s.heldQuantity - s.pickedQuantity <= 0)
    return {
      ...product,
      remaining,
      hasSizes,
      allSizesOos,
      availability: availabilityMap[product.id],
    }
  })

  const subPriorityBySlug = await getSubPriorityMap()

  // Group by product Type (Jerseys, Hats, Fleece, ...) into separate
  // carousel rows, mirroring the Shop catalog's category-grouped browsing
  // view (see ShopPageClient's `groupedSections`) so a brand page reads the
  // same way: each Type presented together rather than one flat grid.
  const buckets = new Map<string, { label: string; products: typeof cards }>()
  for (const product of cards) {
    const key = normalizeProductType(product) || 'other'
    // productType is already properly cased (e.g. "T-Shirts") in the data;
    // only titleCase the subcategory fallback, which is a lowercase slug.
    const rawLabel = product.productType || titleCase(product.subcategory || '') || 'Other'
    const existing = buckets.get(key)
    if (existing) {
      existing.products.push(product)
    } else {
      buckets.set(key, { label: rawLabel, products: [product] })
    }
  }
  const groupedSections = Array.from(buckets.entries())
    .map(([key, group]) => ({ key, ...group }))
    .sort((a, b) => {
      const priorityA = subPriorityBySlug[a.key] ?? FALLBACK_PRIORITY
      const priorityB = subPriorityBySlug[b.key] ?? FALLBACK_PRIORITY
      if (priorityA !== priorityB) return priorityA - priorityB
      return a.label.localeCompare(b.label)
    })

  return (
    <div className="min-h-screen bg-white">
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
              <Image src={brand.imageUrl} alt={brand.name} fill priority className="object-contain p-3" sizes="144px" />
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
        <div className="space-y-10">
          {groupedSections.map((group) => (
            <section key={group.key} aria-labelledby={`brand-group-${group.key}`}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2
                  id={`brand-group-${group.key}`}
                  className="font-display text-lg font-bold uppercase tracking-wide text-jays-navy sm:text-xl"
                >
                  {group.label}
                  <span className="ml-2 text-xs font-medium normal-case tracking-normal text-jays-steel/70">
                    {group.products.length} {group.products.length === 1 ? 'item' : 'items'}
                  </span>
                </h2>
                <Link
                  href={`/shop?brand=${encodeURIComponent(brand.name)}&sub=${encodeURIComponent(group.label)}`}
                  className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-jays-navy transition-colors hover:text-jays-red"
                >
                  View All
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <ProductCarousel products={group.products} />
            </section>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
