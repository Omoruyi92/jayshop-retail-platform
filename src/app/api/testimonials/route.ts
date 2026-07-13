export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/testimonials — public approved fan reviews and approved site feedback
export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = Math.min(parseInt(limitParam ?? '10', 10), 50)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Approved positive product reviews (4–5 stars), most recent first
  const productReviews = await prisma.productReview.findMany({
    where: { rating: { gte: 4 }, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      product: {
        select: { id: true, name: true, slug: true, imageUrl: true },
      },
    },
  })

  const reviews = productReviews.map((r) => ({
    id: r.id,
    type: 'review' as const,
    name: r.customerName,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    productName: r.product?.name,
    productSlug: r.product?.slug,
    productImage: r.product?.imageUrl,
  }))

  // Approved site feedback messages (visitor comments)
  const feedback = await prisma.siteFeedback.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const feedbackItems = feedback.map((f) => ({
    id: f.id,
    type: 'feedback' as const,
    name: f.name?.trim() || 'A Fan',
    rating: 5,
    comment: f.message,
    createdAt: f.createdAt.toISOString(),
  }))

  const testimonials = [...reviews, ...feedbackItems]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit)

  // Compute stats from all approved positive reviews
  const allPositiveReviews = await prisma.productReview.findMany({
    where: { rating: { gte: 4 }, status: 'APPROVED' },
    select: { rating: true },
  })

  const reviewCount = allPositiveReviews.length
  const avgRating = reviewCount > 0
    ? allPositiveReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0

  // Recent activity count (last 30 days) — approved positive reviews only
  const recentReviewCount = await prisma.productReview.count({
    where: { createdAt: { gte: thirtyDaysAgo }, status: 'APPROVED', rating: { gte: 4 } },
  })

  return NextResponse.json({
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount,
    recentReviewCount,
    testimonials,
    reviews,
    feedback: feedbackItems,
  })
}
