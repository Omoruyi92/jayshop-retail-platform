import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public, read-only brand list — the single source of truth for brand
// name/logo lookups on the customer-facing side (e.g. the Shop page's
// active-brand indicator). Deliberately excludes anything admin-only.
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      select: { name: true, slug: true, imageUrl: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ brands })
  } catch (err) {
    console.error('GET /api/brands', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
