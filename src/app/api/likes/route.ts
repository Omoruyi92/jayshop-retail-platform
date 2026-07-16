import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** POST — toggle a product like (heart) */
export async function POST(req: NextRequest) {
  try {
    const { productId, sessionId } = await req.json()

    if (!productId || !sessionId) {
      return NextResponse.json({ error: 'Missing productId or sessionId' }, { status: 400 })
    }

    // Check if already liked
    const existing = await prisma.productLike.findUnique({
      where: { productId_sessionId: { productId, sessionId } },
    })

    if (existing) {
      // Unlike
      await prisma.productLike.delete({ where: { id: existing.id } })
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await prisma.productLike.create({ data: { productId, sessionId } })
      return NextResponse.json({ liked: true })
    }
  } catch (err) {
    console.error('POST /api/likes error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/** GET — return liked products (with product details) for a session, sourced live from the DB */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ likes: [] })
  }

  const likes = await prisma.productLike.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: { id: true, slug: true, name: true, imageUrl: true, priceCents: true },
      },
    },
  })

  const favorites = likes
    .filter((l) => l.product)
    .map((l) => ({
      productId: l.product!.id,
      slug: l.product!.slug,
      name: l.product!.name,
      imageUrl: l.product!.imageUrl,
      priceCents: l.product!.priceCents,
      likedAt: l.createdAt.getTime(),
    }))

  return NextResponse.json({ likes: favorites.map((f) => f.productId), favorites })
}
