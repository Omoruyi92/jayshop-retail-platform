import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Total likes
    const totalLikes = await prisma.productLike.count()

    // Total unique products liked
    const uniqueProducts = await prisma.productLike.groupBy({
      by: ['productId'],
    })

    // Top liked products (top 10)
    const topLikedRaw = await prisma.productLike.groupBy({
      by: ['productId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const topProductIds = topLikedRaw.map((r) => r.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, slug: true, imageUrl: true, category: true, brand: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const topLiked = topLikedRaw.map((r) => {
      const p = productMap.get(r.productId)
      return {
        productId: r.productId,
        productName: p?.name ?? 'Unknown',
        productImage: p?.imageUrl ?? '',
        productSlug: p?.slug ?? '',
        category: p?.category ?? '',
        brand: p?.brand ?? '',
        likeCount: r._count.id,
      }
    })

    // Likes trend last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentLikes = await prisma.productLike.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Build daily counts
    const dailyMap: Record<string, number> = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      dailyMap[d.toISOString().slice(0, 10)] = 0
    }
    for (const like of recentLikes) {
      const day = like.createdAt.toISOString().slice(0, 10)
      if (dailyMap[day] !== undefined) {
        dailyMap[day]++
      }
    }
    const likesTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

    // Recent likes (last 20)
    const recentLikeEntries = await prisma.productLike.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, imageUrl: true, slug: true } },
      },
    })

    const recent = recentLikeEntries.map((l) => ({
      id: l.id,
      productName: l.product.name,
      productImage: l.product.imageUrl,
      productSlug: l.product.slug,
      createdAt: l.createdAt.toISOString(),
    }))

    return NextResponse.json({
      totalLikes,
      uniqueProductsLiked: uniqueProducts.length,
      topLiked,
      likesTrend,
      recent,
    })
  } catch (err) {
    console.error('GET /api/admin/likes error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
