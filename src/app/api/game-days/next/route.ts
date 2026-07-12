export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/game-days/next — public: next upcoming Blue Jays home game day (if any)
export async function GET() {
  // GameDay.date is stored as a UTC calendar date (no time-of-day). Compare
  // using UTC "today" so this matches isGameDay() and the admin dashboard —
  // using local server time here would risk an off-by-one mismatch.
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const gameDay = await prisma.gameDay.findFirst({
    where: { date: { gte: today } },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json({ gameDay })
}
