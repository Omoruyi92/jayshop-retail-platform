import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function formatCAD(cents: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n')
}

export async function GET(req: Request) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const dateFrom    = searchParams.get('dateFrom')
  const dateTo      = searchParams.get('dateTo')
  const finalStatus = searchParams.get('finalStatus')
  const phone       = searchParams.get('phone')
  const product     = searchParams.get('product')
  const adminId     = searchParams.get('adminId')
  const showArchived = searchParams.get('showArchived') === 'true'

  const resolvedAtFilter = (dateFrom || dateTo)
    ? { ...(dateFrom ? { gte: new Date(dateFrom) } : {}), ...(dateTo ? { lte: new Date(dateTo) } : {}) }
    : undefined

  const where = {
    ...(!showArchived ? { archivedAt: null } : {}),
    ...(finalStatus ? { finalStatus } : {}),
    ...(phone ? { customerPhoneSnapshot: { contains: phone } } : {}),
    ...(product ? { productNameSnapshot: { contains: product } } : {}),
    ...(adminId ? { resolvedByAdminId: adminId } : {}),
    ...(resolvedAtFilter ? { resolvedAt: resolvedAtFilter } : {}),
  }

  const rows = await prisma.holdHistory.findMany({
    where,
    include: { resolvedBy: { select: { email: true } } },
    orderBy: { resolvedAt: 'desc' },
  })

  const header = [
    'Reservation Code',
    'Product Name',
    'Qty',
    'Total Price (CAD)',
    'Customer Name',
    'Customer Phone',
    'Placed At',
    'Expires At',
    'Final Status',
    'Resolved At',
    'Resolved By',
    'Notes',
  ]

  const dataRows = rows.map((r) => {
    const qty = r.holdQuantity ?? 1
    const total = r.totalPriceCentsSnapshot > 0 ? r.totalPriceCentsSnapshot : r.productPriceCentsSnapshot * qty
    return [
      r.reservationCode,
      r.productNameSnapshot,
      String(qty),
      formatCAD(total),
      r.customerNameSnapshot,
      r.customerPhoneSnapshot,
      r.placedAt.toISOString(),
      r.expiresAt.toISOString(),
      r.finalStatus,
      r.resolvedAt.toISOString(),
      r.resolvedBy?.email ?? 'system',
      r.notes ?? '',
    ]
  })

  const csv = toCSV([header, ...dataRows])

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="jays-shop-history-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
