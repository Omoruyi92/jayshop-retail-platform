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
      select: { id: true, productId: true },
    })

    // Same read-time guard as GET /api/notifications: only mark notifications
    // as read if their linked product is still a live New Arrival. This keeps
    // "mark all read" / unread-count semantics consistent with what the
    // customer can actually see in the dropdown, and avoids writing receipts
    // for stale rows tied to products that no longer qualify.
    const productIds = Array.from(
      new Set(notifications.map((n) => n.productId).filter((id): id is string => Boolean(id)))
    )
    const liveProducts = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, isNewArrival: true, status: { not: 'ARCHIVED' } },
          select: { id: true },
        })
      : []
    const liveProductIds = new Set(liveProducts.map((p) => p.id))
    const visibleNotifications = notifications.filter(
      (n) => !n.productId || liveProductIds.has(n.productId)
    )

    await prisma.$transaction(
      visibleNotifications.map((n) =>
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

    return NextResponse.json({ success: true, count: visibleNotifications.length })
  } catch {
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 })
  }
}
