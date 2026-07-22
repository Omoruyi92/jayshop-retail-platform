import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Revalidated on-demand via revalidateTag('players') from the admin
// players routes (create/update/delete) — see
// src/app/api/admin/players/route.ts and .../[id]/route.ts — plus a 60s
// fallback TTL so the catalog (which rarely changes) never hits Postgres
// on every request the way `force-dynamic` previously did.
const getCachedPlayers = unstable_cache(
  async (search: string, position: string, featured: boolean, trending: boolean) => {
    return prisma.player.findMany({
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
  },
  ['players-list'],
  { revalidate: 60, tags: ['players'] }
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const position = searchParams.get('position')?.trim() ?? ''
  const featured = searchParams.get('featured') === 'true'
  const trending = searchParams.get('trending') === 'true'

  const players = await getCachedPlayers(search, position, featured, trending)

  return NextResponse.json({ players })
}
