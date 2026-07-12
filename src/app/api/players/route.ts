import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const position = searchParams.get('position')?.trim() ?? ''
  const featured = searchParams.get('featured') === 'true'
  const trending = searchParams.get('trending') === 'true'

  const players = await prisma.player.findMany({
    where: {
      status: 'ACTIVE',
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(position && { position }),
      ...(featured && { isFeatured: true }),
      ...(trending && { isTrending: true }),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { products: true } },
    },
  })

  return NextResponse.json({ players })
}
