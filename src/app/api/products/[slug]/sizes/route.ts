import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 15

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const rows = await prisma.sizeInventory.findMany({
    where: { productId: product.id },
    select: { size: true, quantity: true, heldQuantity: true },
    orderBy: { size: 'asc' },
  })

  if (rows.length === 0) {
    return NextResponse.json({ hasSizeInventory: false, sizes: [] })
  }

  return NextResponse.json({
    hasSizeInventory: true,
    sizes: rows.map((r) => ({
      size: r.size,
      available: Math.max(0, r.quantity - r.heldQuantity),
    })),
  })
}

