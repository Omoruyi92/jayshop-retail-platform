export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

export async function GET(req: NextRequest) {
  const { error } = await requireRole(req, 'reviews:read')
  if (error) return error

  const statusFilter = req.nextUrl.searchParams.get('status') ?? undefined
  const where = statusFilter && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusFilter)
    ? { status: statusFilter }
    : {}

  // Reviews with product info
  const reviews = await prisma.productReview.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: { id: true, name: true, slug: true, imageUrl: true, brand: true, category: true },
      },
    },
  })

  // Overall stats (all reviews)
  const allReviews = await prisma.productReview.findMany({
    select: { id: true, productId: true, rating: true, status: true, createdAt: true },
  })

  const totalReviews = allReviews.length
  const avgRating = totalReviews > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0

  const pendingCount = allReviews.filter((r) => r.status === 'PENDING').length
  const approvedCount = allReviews.filter((r) => r.status === 'APPROVED').length
  const rejectedCount = allReviews.filter((r) => r.status === 'REJECTED').length

  // Rating distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of allReviews) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1
  }

  // Per-product aggregation (approved only)
  const productMap = new Map<string, {
    productId: string
    productName: string
    productSlug: string
    productImage: string
    brand: string
    category: string
    totalReviews: number
    totalRating: number
    avgRating: number
    ratings: Record<number, number>
  }>()

  for (const r of allReviews) {
    if (r.status !== 'APPROVED') continue
    const product = reviews.find((rev) => rev.productId === r.productId)?.product
    if (!product) continue

    if (!productMap.has(r.productId)) {
      productMap.set(r.productId, {
        productId: r.productId,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.imageUrl,
        brand: product.brand,
        category: product.category,
        totalReviews: 0,
        totalRating: 0,
        avgRating: 0,
        ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      })
    }
    const entry = productMap.get(r.productId)!
    entry.totalReviews++
    entry.totalRating += r.rating
    entry.ratings[r.rating] = (entry.ratings[r.rating] || 0) + 1
  }

  // Compute averages and sort
  const perProduct = Array.from(productMap.values())
    .map((p) => ({ ...p, avgRating: p.totalRating / p.totalReviews }))
    .sort((a, b) => b.totalReviews - a.totalReviews)

  const mostRated = perProduct.length > 0 ? perProduct[0] : null
  const leastRated = perProduct.length > 0
    ? [...perProduct].sort((a, b) => a.avgRating - b.avgRating)[0]
    : null
  const highestRated = perProduct.length > 0
    ? [...perProduct].sort((a, b) => b.avgRating - a.avgRating)[0]
    : null

  // Sentiment trend — reviews per day for last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sentimentTrend: { date: string; count: number; avgRating: number }[] = []
  const dayMap = new Map<string, { count: number; total: number }>()

  for (const r of allReviews) {
    if (r.createdAt >= thirtyDaysAgo && r.status === 'APPROVED') {
      const day = r.createdAt.toISOString().slice(0, 10)
      const entry = dayMap.get(day) || { count: 0, total: 0 }
      entry.count++
      entry.total += r.rating
      dayMap.set(day, entry)
    }
  }

  // Fill in all 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const day = d.toISOString().slice(0, 10)
    const entry = dayMap.get(day)
    sentimentTrend.push({
      date: day,
      count: entry?.count ?? 0,
      avgRating: entry ? entry.total / entry.count : 0,
    })
  }

  // Recent reviews (latest 50)
  const recentReviews = reviews.slice(0, 50).map((r) => ({
    id: r.id,
    customerName: r.customerName,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    moderatedBy: r.moderatedBy,
    moderatedAt: r.moderatedAt,
    createdAt: r.createdAt.toISOString(),
    productName: r.product.name,
    productSlug: r.product.slug,
    productImage: r.product.imageUrl,
  }))

  return NextResponse.json({
    totalReviews,
    pendingCount,
    approvedCount,
    rejectedCount,
    avgRating: Math.round(avgRating * 100) / 100,
    distribution,
    perProduct,
    mostRated,
    leastRated,
    highestRated,
    sentimentTrend,
    recentReviews,
  })
}
