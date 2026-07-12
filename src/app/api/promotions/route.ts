import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDbConnectionError, dbUnavailableResponse } from '@/lib/db-error'

export const dynamic = 'force-dynamic'

async function handleGet() {
  const now = new Date()

  const promotions = await prisma.promotionMessage.findMany({
    where: {
      status: 'APPROVED',
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, text: true, link: true, priority: true },
  })

  return NextResponse.json({ promotions })
}

export async function GET(request: Request) {
  try {
    return await handleGet()
  } catch (err) {
    if (isDbConnectionError(err)) return dbUnavailableResponse()
    console.error('GET /api/promotions', err)
    return NextResponse.json({ promotions: [] }, { status: 500 })
  }
}
