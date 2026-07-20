import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetails from '@/components/shop/ProductDetails'
import ProductCategoryNav from '@/components/shop/ProductCategoryNav'
import ProductImageGallery from '@/components/shop/ProductImageGallery'
import ProductReviews from '@/components/shop/ProductReviews'
import RecentlyViewed from '@/components/shop/RecentlyViewed'
import TrackRecentlyViewed from '@/components/shop/TrackRecentlyViewed'
import YouMayAlsoLike from '@/components/shop/YouMayAlsoLike'
import StickyShopCategoryNav from '@/components/shop/StickyShopCategoryNav'
import { getProductAvailability } from '@/lib/inventory/aggregate'

export const revalidate = 30

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product || product.status === 'ARCHIVED') return { title: 'Product Not Found' }
  return { title: product.name }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  })

  if (!product || product.status === 'ARCHIVED') notFound()

  // Fetch per-size availability if SizeInventory rows exist
  const sizeRows = await prisma.sizeInventory.findMany({
    where: { productId: product.id },
    select: {
      size: true,
      quantity: true,
      heldQuantity: true,
      pickedQuantity: true,
      location: { select: { id: true, name: true, code: true, isMainStore: true } }
    },
  })

  const hasSizes = sizeRows.length > 0

  // When size rows exist: use sum of per-size available stock as the meaningful remaining count.
  // When no size rows: fall back to product-level quantity.
  const remaining = hasSizes
    ? sizeRows.reduce((sum, r) => sum + Math.max(0, r.quantity - r.heldQuantity - r.pickedQuantity), 0)
    : Math.max(0, product.quantity - product.heldQuantity - product.pickedQuantity)

  // Sold-out: for size-tracked products, only when every size is exhausted.
  // For non-size products, when remaining == 0. SOLD status always overrides.
  const allSizesOos = hasSizes && sizeRows.every((r) => r.quantity - r.heldQuantity - r.pickedQuantity <= 0)
  const isSoldOut = product.status === 'SOLD' || (hasSizes ? allSizesOos : remaining <= 0)

  const sizes = product.sizes ? product.sizes.split(',').filter(Boolean) : []
  const displayStatus = product.status === 'SOLD' && product.heldQuantity > 0 ? 'ON_HOLD' : (isSoldOut ? 'SOLD_OUT' : 'AVAILABLE')


  let sizeAvailability: { size: string; available: number }[] | null = null
  let locationInventory: any[] = []

  if (hasSizes) {
    // Group sizes properly for the dropdown
    const sizeMap = new Map<string, number>()
    sizeRows.forEach(r => {
      const avail = Math.max(0, r.quantity - r.heldQuantity - r.pickedQuantity)
      sizeMap.set(r.size, (sizeMap.get(r.size) || 0) + avail)
    })
    sizeAvailability = Array.from(sizeMap.entries()).map(([size, available]) => ({ size, available }))

    // Group by location for the stadium omnichannel feature
    const locMap = new Map<string, any>()
    sizeRows.forEach(r => {
      const locId = r.location.id
      if (!locMap.has(locId)) {
        locMap.set(locId, {
          id: r.location.id,
          name: r.location.name,
          code: r.location.code,
          isMainStore: r.location.isMainStore,
          sizes: [],
          totalAvailable: 0
        })
      }
      const avail = Math.max(0, r.quantity - r.heldQuantity - r.pickedQuantity)
      const locData = locMap.get(locId)
      locData.sizes.push({ size: r.size, available: avail })
      locData.totalAvailable += avail
    })
    locationInventory = Array.from(locMap.values())
  }


  const availability = await getProductAvailability(product.id)

  const images = [product.imageUrl, product.imageUrl2, product.imageUrl3].filter(Boolean)

  return (
    <div className="min-h-screen bg-white pt-[var(--subnav-height,2.75rem)]">
      <StickyShopCategoryNav activeCategory={product.category} />
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <TrackRecentlyViewed
        id={product.id}
        slug={product.slug}
        name={product.name}
        imageUrl={product.imageUrl}
        priceCents={product.priceCents}
      />

      <ProductCategoryNav currentSlug={product.slug} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery Column */}
        <div className="lg:col-span-7 lg:sticky lg:top-24">
          <div
            className="bg-white rounded-3xl shadow-sm overflow-hidden relative aspect-[4/3] md:aspect-[4/3] w-full border border-gray-100/50"
            style={{ position: 'relative' }}
          >
            <ProductImageGallery images={images} alt={product.name} />
          </div>
        </div>

        {/* Details Column */}
        <div className="lg:col-span-5 flex flex-col bg-white lg:bg-transparent rounded-3xl lg:rounded-none shadow-sm lg:shadow-none p-6 lg:p-0 border border-gray-100/50 lg:border-none">
          <ProductDetails
            product={product}
            remaining={remaining}
            isSoldOut={isSoldOut}
            sizes={sizes}
            displayStatus={displayStatus}
            sizeAvailability={sizeAvailability}
            locationInventory={locationInventory}
            availability={availability}
          />
        </div>
      </div>

      <div className="mt-16 lg:mt-24">
        <ProductReviews productId={product.id} />
      </div>

      <div className="mt-12 lg:mt-16 border-t border-gray-100 pt-12">
        <YouMayAlsoLike productId={product.id} category={product.category} />
      </div>

      <div className="mt-12 lg:mt-16 border-t border-gray-100 pt-12">
        <RecentlyViewed />
      </div>
    </div>
    </div>
  )
}
