import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope')?.toUpperCase()

    const where: any = { active: true }
    if (scope && ['HOME', 'SHOP'].includes(scope)) where.scope = scope

    const slides = await prisma.heroSlide.findMany({
      where,
      orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }],
    })

    return NextResponse.json(slides)
  } catch (err: any) {
    console.error('public hero slides error:', err)
    return NextResponse.json({ error: err.message || 'Fetch failed' }, { status: 500 })
  }
}
