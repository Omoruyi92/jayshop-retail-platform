import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await prisma.product.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: {
      category: true,
      isFeatured: true,
      isNewArrival: true,
      isClearance: true,
      isBlankJersey: true,
      salePriceCents: true,
    },
  })

  const categorySet = new Set<string>()
  let hasFeatured = false
  let hasNewArrival = false
  let hasClearance = false
  let hasBlanks = false

  for (const p of products) {
    if (p.category) categorySet.add(p.category.toLowerCase())
    if (p.isFeatured) hasFeatured = true
    if (p.isNewArrival) hasNewArrival = true
    if (p.isClearance || (p.salePriceCents ?? 0) > 0) hasClearance = true
    if (p.isBlankJersey) hasBlanks = true
  }

  return NextResponse.json({
    categories: Array.from(categorySet),
    hasFeatured,
    hasNewArrival,
    hasClearance,
    hasBlanks,
  })
}
