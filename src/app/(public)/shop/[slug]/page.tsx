import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductDetails from '@/components/shop/ProductDetails'
import ProductImageGallery from '@/components/shop/ProductImageGallery'
import ProductReviews from '@/components/shop/ProductReviews'
import RecentlyViewed from '@/components/shop/RecentlyViewed'
import TrackRecentlyViewed from '@/components/shop/TrackRecentlyViewed'

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
    select: { size: true, quantity: true, heldQuantity: true },
  })

  const hasSizes = sizeRows.length > 0

  // When size rows exist: use sum of per-size available stock as the meaningful remaining count.
  // When no size rows: fall back to product-level quantity.
  const remaining = hasSizes
    ? sizeRows.reduce((sum, r) => sum + Math.max(0, r.quantity - r.heldQuantity), 0)
    : Math.max(0, product.quantity - product.heldQuantity)

  // Sold-out: for size-tracked products, only when every size is exhausted.
  // For non-size products, when remaining == 0. SOLD status always overrides.
  const allSizesOos = hasSizes && sizeRows.every((r) => r.quantity - r.heldQuantity <= 0)
  const isSoldOut = product.status === 'SOLD' || (hasSizes ? allSizesOos : remaining <= 0)

  const sizes = product.sizes ? product.sizes.split(',').filter(Boolean) : []
  const displayStatus = isSoldOut ? 'SOLD_OUT' : 'AVAILABLE'

  const sizeAvailability: { size: string; available: number }[] | null =
    hasSizes
      ? sizeRows.map((r) => ({ size: r.size, available: Math.max(0, r.quantity - r.heldQuantity) }))
      : null

  const images = [product.imageUrl, product.imageUrl2, product.imageUrl3].filter(Boolean)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <TrackRecentlyViewed
        id={product.id}
        slug={product.slug}
        name={product.name}
        imageUrl={product.imageUrl}
        priceCents={product.priceCents}
      />
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="relative aspect-[4/3] bg-gray-100">
          <ProductImageGallery images={images} alt={product.name} />
        </div>
        <ProductDetails
          product={product}
          remaining={remaining}
          isSoldOut={isSoldOut}
          sizes={sizes}
          displayStatus={displayStatus}
          sizeAvailability={sizeAvailability}
        />
      </div>

      <div className="mt-6">
        <ProductReviews productId={product.id} />
      </div>

      <RecentlyViewed />
    </div>
  )
}
