export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reviews?productId=xxx — fetch approved and pending reviews for a product detail page
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  const reviews = await prisma.productReview.findMany({
    where: { productId, status: { not: 'REJECTED' } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ reviews })
}

// POST /api/reviews — submit a new review (awaits admin approval)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, customerName, rating, comment } = body

    if (!productId || !customerName?.trim() || !comment?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const ratingNum = Number(rating)
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const review = await prisma.productReview.create({
      data: {
        productId,
        customerName: customerName.trim(),
        rating: ratingNum,
        comment: comment.trim(),
        status: 'PENDING',
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
