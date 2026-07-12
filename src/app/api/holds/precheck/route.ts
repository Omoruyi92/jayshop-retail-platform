import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { effectivePickupQty } from '@/lib/holds/effectivePickupQty'
import { getHoldSettings } from '@/lib/holds/getHoldSettings'
import { isGameDay } from '@/lib/holds/isGameDay'
import { getEffectiveHoldHours } from '@/lib/holds/getEffectiveHoldHours'
import { getHoldReservationLocationId } from '@/lib/store-locations'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const size = searchParams.get('size')
  const holdType = searchParams.get('holdType') // 'stadium' | 'standard'

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const now = new Date()
  const [settings, gameDay, locationId] = await Promise.all([
    getHoldSettings(),
    isGameDay(now),
    getHoldReservationLocationId(holdType === 'stadium'),
  ])

  let available: number
  if (size) {
    available = await effectivePickupQty(productId, size, locationId)
  } else {
    const rows = await prisma.sizeInventory.findMany({
      where: { productId, locationId },
      select: { quantity: true, heldQuantity: true, pickedQuantity: true },
    })
    available = rows.reduce((sum, r) => sum + Math.max(0, r.quantity - r.heldQuantity - r.pickedQuantity), 0)
  }

  // Effective hours for both pickup paths. Extended (Gate 5 / 48h) pickup is
  // only offered when the toggle is on and today is not a game day.
  const extendedAvailable = settings.enable48HourHold && !gameDay
  const stadiumHours = getEffectiveHoldHours(settings, gameDay, true)
  const gate5Hours = extendedAvailable ? settings.extendedHoldHours : null

  return NextResponse.json({
    available,
    gameDay,
    enable48HourHold: settings.enable48HourHold,
    extendedAvailable,
    stadiumHours,
    gate5Hours,
    standardHoldHours: settings.standardHoldHours,
    extendedHoldHours: settings.extendedHoldHours,
  })
}
