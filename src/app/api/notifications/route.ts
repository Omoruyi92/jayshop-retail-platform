export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const GUEST_COOKIE = 'jays_guest_id'
const EXPIRY_HOURS = 24

function getCustomerId(req: NextRequest) {
  // Prefer phone number if available (from hold/customer session)
  const phone = req.cookies.get('customer_phone')?.value
  if (phone) return `phone:${phone}`

  // Fall back to guest cookie
  const guestId = req.cookies.get(GUEST_COOKIE)?.value
  if (guestId) return `guest:${guestId}`

  return null
}

// GET /api/notifications — list recent customer notifications (per-user expiry)
export async function GET(req: NextRequest) {
  const customerId = getCustomerId(req)
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = Math.min(parseInt(limitParam ?? '20', 10), 50)
  const now = new Date()

  // Recent notifications for the feed (last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const notifications = await prisma.customerNotification.findMany({
    where: {
      type: 'NEW_ARRIVAL',
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      receipts: customerId
        ? { where: { customerId } }
        : false,
    },
  })

  // Defense-in-depth: exclude notifications whose linked product was deleted
  // or archived after the notification was created. Products are hard-deleted
  // elsewhere (with matching notification cleanup), but this guards against
  // any stale rows so a customer never sees/clicks a dead "New Arrival".
  const productIds = Array.from(new Set(notifications.map((n) => n.productId).filter(Boolean))) as string[]
  const liveProducts = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds }, status: { not: 'ARCHIVED' } },
        select: { id: true },
      })
    : []
  const liveProductIds = new Set(liveProducts.map((p) => p.id))

  // Filter out notifications that have been opened and expired for this user
  const visibleNotifications = notifications.filter((n) => {
    if (n.productId && !liveProductIds.has(n.productId)) return false
    const receipt = customerId ? n.receipts[0] : null
    if (receipt?.expiresAt) {
      return receipt.expiresAt > now
    }
    return true
  })

  const mapped = visibleNotifications.map((n) => {
    const receipt = customerId ? n.receipts[0] : null
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      productId: n.productId,
      productSlug: n.productSlug,
      imageUrl: n.imageUrl,
      isRead: receipt?.isRead ?? false,
      isOpened: receipt?.isOpened ?? false,
      createdAt: n.createdAt.toISOString(),
    }
  })

  const unreadCount = mapped.filter((n) => !n.isRead).length

  return NextResponse.json({
    notifications: mapped,
    unreadCount,
    customerId,
  })
}

// POST /api/notifications/open — start 24h expiration when user opens the feed
export async function POST(req: NextRequest) {
  const customerId = getCustomerId(req)
  if (!customerId) {
    return NextResponse.json({ error: 'No customer identifier' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { notificationId } = body
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId required' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000)

    await prisma.customerNotificationReceipt.upsert({
      where: {
        notificationId_customerId: {
          notificationId,
          customerId,
        },
      },
      update: {
        isOpened: true,
        openedAt: new Date(),
        expiresAt,
      },
      create: {
        notificationId,
        customerId,
        isOpened: true,
        openedAt: new Date(),
        expiresAt,
      },
    })

    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() })
  } catch {
    return NextResponse.json({ error: 'Failed to record open' }, { status: 500 })
  }
}
