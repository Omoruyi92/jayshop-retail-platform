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

/** GET — return liked product IDs for a session */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return NextResponse.json({ likes: [] })
  }

  const likes = await prisma.productLike.findMany({
    where: { sessionId },
    select: { productId: true },
  })

  return NextResponse.json({ likes: likes.map((l) => l.productId) })
}
