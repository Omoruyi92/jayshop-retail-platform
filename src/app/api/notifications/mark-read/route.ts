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

// POST /api/notifications/mark-read — mark all visible new-arrival notifications as read for the current user
export async function POST(req: NextRequest) {
  const customerId = getCustomerId(req)
  if (!customerId) {
    return NextResponse.json({ error: 'No customer identifier' }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'NEW_ARRIVAL'

  try {
    const notifications = await prisma.customerNotification.findMany({
      where: { type },
      select: { id: true },
    })

    await prisma.$transaction(
      notifications.map((n) =>
        prisma.customerNotificationReceipt.upsert({
          where: {
            notificationId_customerId: {
              notificationId: n.id,
              customerId,
            },
          },
          update: { isRead: true },
          create: {
            notificationId: n.id,
            customerId,
            isRead: true,
          },
        })
      )
    )

    return NextResponse.json({ success: true, count: notifications.length })
  } catch {
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 })
  }
}
