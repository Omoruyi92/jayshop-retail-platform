export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GUEST_COOKIE = 'jays_guest_id'

function getCustomerId(req: NextRequest) {
  const phone = req.cookies.get('customer_phone')?.value
  if (phone) return `phone:${phone}`
  const guestId = req.cookies.get(GUEST_COOKIE)?.value
  if (guestId) return `guest:${guestId}`
  return null
}

// PATCH /api/notifications/[id]/read — mark a single notification as read per user
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const customerId = getCustomerId(req)
  if (!customerId) {
    return NextResponse.json({ error: 'No customer identifier' }, { status: 400 })
  }

  const notificationId = params.id

  try {
    await prisma.customerNotificationReceipt.upsert({
      where: {
        notificationId_customerId: {
          notificationId,
          customerId,
        },
      },
      update: { isRead: true },
      create: {
        notificationId,
        customerId,
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 })
  }
}
