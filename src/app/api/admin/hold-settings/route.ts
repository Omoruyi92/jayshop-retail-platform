import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { getHoldSettings } from '@/lib/holds/getHoldSettings'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'hold-settings:manage')
  if (error) return error

  try {
    const settings = await getHoldSettings()
    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[admin/hold-settings] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const { session, error } = await requireRole(req, 'hold-settings:manage')
  if (error) return error
  const adminId = (session as { user?: { adminId?: string } } | null)?.user?.adminId ?? undefined

  try {
    const body = await req.json()
    const { enable48HourHold, standardHoldHours, extendedHoldHours } = body as {
      enable48HourHold?: boolean
      standardHoldHours?: number
      extendedHoldHours?: number
    }

    if (
      typeof enable48HourHold !== 'boolean' ||
      !Number.isInteger(standardHoldHours) ||
      !Number.isInteger(extendedHoldHours) ||
      (standardHoldHours as number) < 1 ||
      (extendedHoldHours as number) < 1
    ) {
      return NextResponse.json(
        { error: 'enable48HourHold (boolean), standardHoldHours and extendedHoldHours (positive integers) are required' },
        { status: 400 }
      )
    }

    const current = await getHoldSettings()
    const before = { enable48HourHold: current.enable48HourHold, standardHoldHours: current.standardHoldHours, extendedHoldHours: current.extendedHoldHours }
    const updated = await prisma.holdSettings.update({
      where: { id: current.id },
      data: {
        enable48HourHold,
        standardHoldHours,
        extendedHoldHours,
        updatedById: adminId ?? null,
      },
    })

    const user = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'hold-settings.updated',
      entityType: 'HoldSettings',
      entityId: updated.id,
      actorId: user.adminId,
      actorType: 'admin',
      actorEmail: user.email,
      before,
      after: { enable48HourHold, standardHoldHours, extendedHoldHours },
      req,
    })

    return NextResponse.json({ settings: updated })
  } catch (err) {
    console.error('[admin/hold-settings] PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
