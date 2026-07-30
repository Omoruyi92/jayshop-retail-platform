import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildManyAvailability } from '@/lib/inventory/aggregate'
import { getMainStoreLocationId } from '@/lib/store-locations'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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

  // Opt-in server-side pagination: only active when a `page` param is
  // present, so existing callers (shop, POS simulator, players admin) that
  // expect the full catalog keep their behavior unchanged.
  const pageParam = searchParams.get('page')
  const paginated = pageParam !== null
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50))

  const where = {
    ...(!includeArchived && { status: { not: 'ARCHIVED' as const } }),
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
        { name: { contains: q, mode: 'insensitive' as const } },
        { brand: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { category: { contains: q, mode: 'insensitive' as const } },
        { subcategory: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  }

  const products = await prisma.product.findMany({
    where,
    ...(paginated && { skip: (page - 1) * limit, take: limit }),
    orderBy: [
      { likes: { _count: 'desc' } },
      { sku: { sort: 'asc', nulls: 'last' } },
    ],
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

  if (paginated) {
    // Total count for the current filter set + a distinct brand facet.
    // The facet intentionally drops the `brand` filter itself so the brand
    // dropdown keeps listing every brand even while one is selected.
    const { brand: _brandFilter, ...whereSansBrand } = where
    const [total, brandRows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where: whereSansBrand,
        select: { brand: true },
        distinct: ['brand'],
        orderBy: { brand: 'asc' },
      }),
    ])
    return NextResponse.json({
      products: productsWithAvailability,
      total,
      page,
      limit,
      brands: brandRows.map((b) => b.brand).filter(Boolean),
    })
  }

  return NextResponse.json({ products: productsWithAvailability })
}
