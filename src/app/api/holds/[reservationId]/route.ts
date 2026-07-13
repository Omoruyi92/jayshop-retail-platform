import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveHold } from '@/lib/holds/resolveHold'
import { autoExpireOverdueHolds } from '@/lib/holds/autoExpireHolds'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { reservationId: string } }) {
  // Inline auto-expire so a fan looking up their hold never sees a stale
  // "ACTIVE" status after the expiry window has already passed.
  await autoExpireOverdueHolds().catch((err) => {
    console.error('[holds/[reservationId]] Inline auto-expire failed:', err)
  })

  const hold = await prisma.hold.findUnique({
    where: { reservationCode: params.reservationId },
    include: { product: true, customer: true },
  })
  if (!hold) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ hold })
}

export async function PATCH(req: Request, { params }: { params: { reservationId: string } }) {
  try {
    const { action, adminId } = await req.json()
    if (!['pickup', 'release'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const hold = await prisma.hold.findUnique({
      where: { reservationCode: params.reservationId },
    })
    if (!hold) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const finalStatus = action === 'pickup' ? 'PICKED_UP' : 'RELEASED'
    await resolveHold(hold.id, finalStatus, adminId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const error = err as Error
    if (error.message === 'HOLD_NOT_ACTIVE') {
      return NextResponse.json({ error: 'Hold is no longer active' }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
