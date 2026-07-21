import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveHold } from '@/lib/holds/resolveHold'
import { requireRole } from '@/lib/auth/authorize.server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireRole(req, 'holds:resolve')
    if (error) return error
    const adminId = (session as { user?: { adminId?: string } } | null)?.user?.adminId ?? undefined

    const body = await req.json()
    const { fulfilledQty } = body as { fulfilledQty: number }

    if (typeof fulfilledQty !== 'number' || !Number.isInteger(fulfilledQty) || fulfilledQty < 0) {
      return NextResponse.json({ error: 'fulfilledQty must be a non-negative integer' }, { status: 400 })
    }

    const hold = await prisma.hold.findUnique({ where: { id: params.id } })
    if (!hold) return NextResponse.json({ error: 'Hold not found' }, { status: 404 })

    // Defensive: treat null holdQuantity (old holds) as 1
    const holdQty = hold.holdQuantity ?? 1

    if (fulfilledQty > holdQty) {
      return NextResponse.json(
        { error: `fulfilledQty (${fulfilledQty}) cannot exceed holdQuantity (${holdQty})` },
        { status: 400 }
      )
    }

    // Determine the final status for the resolved hold
    const finalStatus = fulfilledQty === 0 ? 'RELEASED' : 'PICKED_UP'
    await resolveHold(hold.id, finalStatus as 'PICKED_UP' | 'RELEASED', adminId, fulfilledQty)

    return NextResponse.json({ success: true })
  } catch (err) {
    const error = err as Error
    if (error.message === 'HOLD_NOT_ACTIVE') {
      return NextResponse.json({ error: 'Hold is no longer active' }, { status: 409 })
    }
    // Unique constraint on HoldHistory.holdId — hold was already resolved (double-submit / race)
    if (
      error.message?.includes('Unique constraint failed') ||
      error.message?.includes('UNIQUE constraint failed')
    ) {
      return NextResponse.json({ error: 'Hold is no longer active' }, { status: 409 })
    }
    console.error('[resolve-hold] Unexpected error:', error.message, error.stack)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
