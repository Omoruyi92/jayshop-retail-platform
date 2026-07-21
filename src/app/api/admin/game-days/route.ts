import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'game-days:manage')
  if (error) return error

  try {
    const gameDays = await prisma.gameDay.findMany({
      orderBy: { date: 'asc' },
    })
    return NextResponse.json({ gameDays })
  } catch (err) {
    console.error('[admin/game-days] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'game-days:manage')
  if (error) return error

  try {
    const body = await req.json()
    const { date, opponent, note, startTime } = body as { date?: string; opponent?: string; note?: string; startTime?: string }

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'date is required (YYYY-MM-DD)' }, { status: 400 })
    }
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'date must be a valid date' }, { status: 400 })
    }
    if (startTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime)) {
      return NextResponse.json({ error: 'startTime must be in HH:mm 24-hour format' }, { status: 400 })
    }
    const normalized = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()))

    const gameDay = await prisma.gameDay.create({
      data: {
        date: normalized,
        opponent: opponent || null,
        note: note || null,
        startTime: startTime || null,
      },
    })

    const user = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'game-day.created',
      entityType: 'GameDay',
      entityId: gameDay.id,
      actorId: user.adminId,
      actorType: 'admin',
      actorEmail: user.email,
      after: { date: gameDay.date.toISOString(), opponent, note, startTime },
      req,
    })

    return NextResponse.json({ gameDay }, { status: 201 })
  } catch (err) {
    const e = err as Error
    if (e.message?.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A game day already exists for this date' }, { status: 409 })
    }
    console.error('[admin/game-days] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
