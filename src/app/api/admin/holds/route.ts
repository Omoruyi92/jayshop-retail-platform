import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status')
  const phone = searchParams.get('phone')
  const code = searchParams.get('code')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const stadiumQueue = searchParams.get('stadiumQueue') === 'true'

  const placedAtFilter = (dateFrom || dateTo)
    ? { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) }
    : undefined

  try {
    const holds = await prisma.hold.findMany({
      where: {
        ...(stadiumQueue ? { isStadiumHold: true, status: 'ACTIVE' } : {}),
        ...(!stadiumQueue && statusParam ? { status: statusParam } : {}),
        ...(placedAtFilter ? { placedAt: placedAtFilter } : {}),
        ...(phone ? { customer: { phone: { contains: phone } } } : {}),
        ...(code ? { reservationCode: { contains: code } } : {}),
      },
      include: {
        product: { select: { name: true, priceCents: true, imageUrl: true } },
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: stadiumQueue ? { pickupQueueAt: 'asc' } : { placedAt: 'desc' },
      take: limit,
    })

    // Attach queue position for stadium holds
    const holdsWithQueue = stadiumQueue
      ? holds.map((h, idx) => ({ ...h, queuePosition: idx + 1 }))
      : holds.map((h) => ({ ...h, queuePosition: null }))

    return NextResponse.json({ holds: holdsWithQueue })
  } catch (err) {
    console.error('[admin/holds] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
