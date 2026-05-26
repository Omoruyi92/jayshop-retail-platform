import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter: 10 requests per IP per minute
const rateLimitMap = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60_000
  const maxRequests = 10
  const timestamps = rateLimitMap.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < windowMs)
  if (recent.length >= maxRequests) {
    rateLimitMap.set(ip, recent)
    return true
  }
  recent.push(now)
  rateLimitMap.set(ip, recent)
  return false
}

export async function GET(req: Request, { params }: { params: { phone: string } }) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 })
  }

  const phone = decodeURIComponent(params.phone)
  const customer = await prisma.customer.findUnique({
    where: { phone },
    include: {
      holds: {
        include: { product: true },
        orderBy: { placedAt: 'desc' },
        take: 20,
      },
    },
  })
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  // Fetch hold history for resolved holds so we can show fulfilled qty and final total
  const holdIds = customer.holds.map((h) => h.id)
  const historyRows = holdIds.length
    ? await prisma.holdHistory.findMany({
        where: { holdId: { in: holdIds } },
        select: {
          holdId: true,
          fulfilledQuantity: true,
          finalTotalCents: true,
          finalStatus: true,
        },
      })
    : []

  const historyMap = new Map(historyRows.map((r) => [r.holdId, r]))

  const holds = customer.holds.map((h) => {
    const history = h.id ? historyMap.get(h.id) : undefined
    // Fallback: if totalPriceCents is missing or equals unit price (old data), compute it
    const computedTotal = h.product.priceCents * h.holdQuantity
    const totalPriceCents =
      h.totalPriceCents > 0 && h.totalPriceCents !== h.product.priceCents
        ? h.totalPriceCents
        : computedTotal
    return {
      ...h,
      totalPriceCents,
      fulfilledQuantity: history?.fulfilledQuantity ?? null,
      finalTotalCents: history?.finalTotalCents ?? null,
    }
  })

  return NextResponse.json({ holds })
}
