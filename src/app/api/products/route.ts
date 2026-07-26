import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildManyAvailability } from '@/lib/inventory/aggregate'
import { getMainStoreLocationId } from '@/lib/store-locations'
import { ensureProductTagColumns } from '@/lib/products/ensureProductTagColumns'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await ensureProductTagColumns()

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const slug = searchParams.get('slug')
  const q = searchParams.get('q')
  const brand = searchParams.get('brand')
  const subcategory = searchParams.get('subcategory')
  const productType = searchParams.get('productType')
  const audience = searchParams.get('audience')
  const ageGroup = searchParams.get('ageGroup')
  const hatStyle = searchParams.get('hatStyle')
  const includeArchived = searchParams.get('includeArchived') === 'true'
  const idsParam = searchParams.get('ids')
  const ids = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : null

  const products = await prisma.product.findMany({
    where: {
      ...(!includeArchived && { status: { not: 'ARCHIVED' } }),
      ...(ids && { id: { in: ids } }),
      ...(category && category !== 'all' && { category }),
      ...(brand && { brand }),
      ...(subcategory && { subcategory }),
      ...(productType && { productType }),
      ...(audience && { audience }),
      ...(ageGroup && { ageGroup }),
      ...(hatStyle && { hatStyle }),
      ...(slug && { slug }),
      ...(q && {
        OR: [
          { name: { contains: q } },
          { brand: { contains: q } },
          { description: { contains: q } },
          { category: { contains: q } },
          { subcategory: { contains: q } },
        ],
      }),
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
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
      _count: { select: { likes: true, ...(includeArchived && { holds: true }) } },
    },
  })

  // Compute available stock and all-sizes-OOS flag
  const productsWithRemaining = products.map((p) => {
    const hasSizes = p.sizeInventories.length > 0

    // When size inventory rows exist, sum their available quantities for a
    // meaningful "remaining" count; otherwise fall back to the product-level
    // fields. Subtracting pickedQuantity (not just heldQuantity) keeps this
    // in lockstep with computeProductStatus's definition of "available" —
    // units completed via pickup fulfillment must not reappear as in-stock.
    const remaining = hasSizes
      ? p.sizeInventories.reduce((sum, s) => sum + Math.max(0, s.quantity - s.heldQuantity - s.pickedQuantity), 0)
      : Math.max(0, p.quantity - p.heldQuantity - p.pickedQuantity)

    // allSizesOos: only true when there ARE size rows and every one is OOS
    const allSizesOos =
      hasSizes &&
      p.sizeInventories.every((s) => s.quantity - s.heldQuantity - s.pickedQuantity <= 0)

    return {
      ...p,
      remaining,
      hasSizes,
      allSizesOos,
    }
  })

  // Pull centralized availability status + per-location breakdown from the
  // single source of truth so admin/customer stock badges stay synchronized.
  // Reuses the `sizeInventories` already fetched in the query above instead
  // of re-querying SizeInventory + Product (previously done via
  // `getManyProductsAvailability`, which issued its own duplicate query).
  const mainStoreLocationId = await getMainStoreLocationId()
  const sizeInventoryRows = products.flatMap((p) =>
    p.sizeInventories.map((s) => ({ ...s, productId: p.id }))
  )
  const availabilityMap = buildManyAvailability(products, sizeInventoryRows, mainStoreLocationId)

  const productsWithAvailability = productsWithRemaining.map((p) => ({
    ...p,
    availability: availabilityMap[p.id],
  }))

  return NextResponse.json({ products: productsWithAvailability })
}
