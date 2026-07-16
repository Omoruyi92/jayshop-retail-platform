import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST — explicitly like or unlike a product.
 *
 * Accepts an optional `action: 'like' | 'unlike'`. When provided, the
 * mutation is idempotent (upsert / deleteMany) regardless of the row's
 * current state — this is what makes single-click remove reliable: the
 * client always knows exactly what it wants the end state to be, so a
 * stray client/server drift can never cause the request to do the
 * opposite of what the user asked for.
 *
 * `action` is optional and falls back to legacy toggle behavior (flip
 * whatever the current DB state is) for backwards compatibility.
 */
export async function POST(req: NextRequest) {
  try {
    const { productId, sessionId, action } = await req.json()

    if (!productId || !sessionId) {
      return NextResponse.json({ error: 'Missing productId or sessionId' }, { status: 400 })
    }

    if (action === 'like') {
      await prisma.productLike.upsert({
        where: { productId_sessionId: { productId, sessionId } },
        create: { productId, sessionId },
        update: {},
      })
      return NextResponse.json({ liked: true })
    }

    if (action === 'unlike') {
      await prisma.productLike.deleteMany({ where: { productId, sessionId } })
      return NextResponse.json({ liked: false })
    }

    // Legacy toggle (no explicit action provided)
    const existing = await prisma.productLike.findUnique({
      where: { productId_sessionId: { productId, sessionId } },
    })

    if (existing) {
      await prisma.productLike.delete({ where: { id: existing.id } })
      return NextResponse.json({ liked: false })
    } else {
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
