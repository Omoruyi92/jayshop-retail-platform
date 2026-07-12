import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autoExpireOverdueHolds } from '@/lib/holds/autoExpireHolds'

export const dynamic = 'force-dynamic'
export const revalidate = 15

type Status = 'in-stock' | 'low' | 'out'

function statusFor(quantity: number): Status {
  if (quantity === 0) return 'out'
  if (quantity <= 3) return 'low'
  return 'in-stock'
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  await autoExpireOverdueHolds()

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { id: true, slug: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const rows = await prisma.sizeInventory.findMany({
    where: { productId: product.id },
    select: {
      size: true,
      quantity: true,
      heldQuantity: true,
      pickedQuantity: true,
      location: {
        select: {
          id: true,
          code: true,
          name: true,
          section: true,
          gate: true,
          isPickupQueue: true,
          sortOrder: true,
        },
      },
    },
    orderBy: [{ location: { sortOrder: 'asc' } }, { size: 'asc' }],
  })

  const locationMap = new Map<
    string,
    {
      locationId: string
      code: string
      name: string
      section: string | null
      gate: string | null
      isPickupQueue: boolean
      sortOrder: number
      sizes: { size: string; quantity: number; status: Status }[]
    }
  >()

  for (const row of rows) {
    const loc = row.location
    if (!locationMap.has(loc.id)) {
      locationMap.set(loc.id, {
        locationId: loc.id,
        code: loc.code,
        name: loc.name,
        section: loc.section,
        gate: loc.gate,
        isPickupQueue: loc.isPickupQueue,
        sortOrder: loc.sortOrder,
        sizes: [],
      })
    }
    // For the stadium pickup queue (SEC-123), the fan-visible quantity must
    // subtract active holds (heldQuantity) and permanently sold units
    // (pickedQuantity) so this always matches admin-side effective stock.
    // Other locations show raw quantity (holds are never placed there).
    const effectiveQuantity = loc.isPickupQueue
      ? Math.max(0, row.quantity - row.heldQuantity - row.pickedQuantity)
      : row.quantity
    locationMap.get(loc.id)!.sizes.push({
      size: row.size,
      quantity: effectiveQuantity,
      status: statusFor(effectiveQuantity),
    })
  }

  const locations = Array.from(locationMap.values())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ sortOrder: _sortOrder, ...rest }) => rest)

  return NextResponse.json({
    productId: product.id,
    slug: product.slug,
    locations,
  })
}
