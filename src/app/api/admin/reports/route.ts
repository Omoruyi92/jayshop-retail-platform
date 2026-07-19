import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

export const dynamic = 'force-dynamic'

function getPeriodDates(period: string, dateFrom?: string | null, dateTo?: string | null) {
  if (dateFrom && dateTo) return { from: new Date(dateFrom), to: new Date(dateTo) }
  const to = new Date()
  const from = new Date()
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7
  from.setDate(from.getDate() - days)
  return { from, to }
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'reports:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const period   = searchParams.get('period') ?? '30d'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo   = searchParams.get('dateTo')
  const { from, to } = getPeriodDates(period, dateFrom, dateTo)

  const dateFilter = { gte: from, lte: to }

  // All history rows in period (by resolvedAt)
  const [allHistory, salesHistory] = await Promise.all([
    prisma.holdHistory.findMany({
      where: { resolvedAt: dateFilter, archivedAt: null },
      select: {
        finalStatus: true,
        placedAt: true,
        productNameSnapshot: true,
        productId: true,
        holdQuantity: true,
      },
    }),
    prisma.salesHistory.findMany({
      where: { soldAt: dateFilter },
      select: {
        productNameSnapshot: true,
        productId: true,
        salePriceCentsSnapshot: true, // total price (unit × holdQuantity)
        holdQuantity: true,
        soldAt: true,
        customerPhoneSnapshot: true,
      },
    }),
  ])

  const total = allHistory.length
  const pickedUp = allHistory.filter((h) => h.finalStatus === 'PICKED_UP').length
  const expired  = allHistory.filter((h) => h.finalStatus === 'EXPIRED').length
  const conversionRate = total > 0 ? Math.round((pickedUp / total) * 100) : 0
  const noShowRate     = total > 0 ? Math.round((expired / total) * 100)  : 0

  // Top 10 items held (from HoldHistory) — count by hold quantity
  const heldMap: Record<string, { name: string; count: number }> = {}
  for (const h of allHistory) {
    const key = h.productId ?? h.productNameSnapshot
    if (!heldMap[key]) heldMap[key] = { name: h.productNameSnapshot, count: 0 }
    heldMap[key].count += h.holdQuantity ?? 1
  }
  const topHeld = Object.values(heldMap).sort((a, b) => b.count - a.count).slice(0, 10)

  // Top 10 items sold (from SalesHistory) — units = sum of holdQuantity, revenue = sum of salePriceCentsSnapshot
  const soldMap: Record<string, { name: string; units: number; revenueCents: number }> = {}
  let totalRevenueCents = 0
  for (const s of salesHistory) {
    const key = s.productId ?? s.productNameSnapshot
    if (!soldMap[key]) soldMap[key] = { name: s.productNameSnapshot, units: 0, revenueCents: 0 }
    soldMap[key].units += s.holdQuantity ?? 1
    soldMap[key].revenueCents += s.salePriceCentsSnapshot
    totalRevenueCents += s.salePriceCentsSnapshot
  }
  const topSold = Object.values(soldMap).sort((a, b) => b.units - a.units).slice(0, 10)

  // Weekly revenue (ISO week, from SalesHistory) — uses total price per sale
  const weekMap: Record<string, number> = {}
  for (const s of salesHistory) {
    const d = new Date(s.soldAt)
    // ISO week start (Monday)
    const day = d.getDay() || 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - day + 1)
    const key = monday.toISOString().slice(0, 10)
    weekMap[key] = (weekMap[key] ?? 0) + s.salePriceCentsSnapshot
  }
  // Zero-fill all weeks in the period so the chart always shows the full range
  const cursor = new Date(from)
  const startDay = cursor.getDay() || 7
  cursor.setDate(cursor.getDate() - startDay + 1)
  cursor.setHours(0, 0, 0, 0)
  while (cursor <= to) {
    const key = cursor.toISOString().slice(0, 10)
    if (!(key in weekMap)) weekMap[key] = 0
    cursor.setDate(cursor.getDate() + 7)
  }

  const weeklyRevenue = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, revenueCents]) => ({ week, revenueCents }))

  // Per-customer no-show stats — from all-time history for accuracy
  const customerMap: Record<string, { phone: string; total: number; expired: number }> = {}
  const allTimeHistory = await prisma.holdHistory.findMany({
    where: { archivedAt: null },
    select: { customerPhoneSnapshot: true, finalStatus: true },
  })
  for (const h of allTimeHistory) {
    const key = h.customerPhoneSnapshot
    if (!customerMap[key]) customerMap[key] = { phone: key, total: 0, expired: 0 }
    customerMap[key].total++
    if (h.finalStatus === 'EXPIRED') customerMap[key].expired++
  }
  const noShowCustomers = Object.values(customerMap)
    .filter((c) => c.expired >= 2)
    .map((c) => ({ ...c, noShowRate: Math.round((c.expired / c.total) * 100) }))
    .sort((a, b) => b.noShowRate - a.noShowRate)
    .slice(0, 20)

  return NextResponse.json({
    period, from: from.toISOString(), to: to.toISOString(),
    totalHolds: total,
    pickedUp,
    expired,
    conversionRate,
    noShowRate,
    totalRevenueCents,
    topHeld,
    topSold,
    weeklyRevenue,
    noShowCustomers,
  })
}
