import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth'

function formatCAD(cents: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? '"' + s.replace(/"/g, '""') + '"'
    : s
}

function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n')
}

export async function GET(req: Request) {
  const { error } = await requireAdminSession()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '30d'
  const to = new Date()
  const from = new Date()
  const days = period === '90d' ? 90 : period === '30d' ? 30 : 7
  from.setDate(from.getDate() - days)
  const dateFilter = { gte: from, lte: to }

  const [historyRows, salesRows] = await Promise.all([
    prisma.holdHistory.findMany({
      where: { resolvedAt: dateFilter, archivedAt: null },
      select: { finalStatus: true, productNameSnapshot: true, productPriceCentsSnapshot: true, customerPhoneSnapshot: true, resolvedAt: true },
    }),
    prisma.salesHistory.findMany({
      where: { soldAt: dateFilter },
      select: { productNameSnapshot: true, salePriceCentsSnapshot: true, holdQuantity: true, customerPhoneSnapshot: true, soldAt: true },
    }),
  ])

  const total    = historyRows.length
  const pickedUp = historyRows.filter((h) => h.finalStatus === 'PICKED_UP').length
  const expired  = historyRows.filter((h) => h.finalStatus === 'EXPIRED').length
  const totalRevCents = salesRows.reduce((s, r) => s + r.salePriceCentsSnapshot, 0)

  const summaryHeader = ['Metric', 'Value']
  const summaryData = [
    ['Period', `${period} (${from.toISOString().slice(0,10)} – ${to.toISOString().slice(0,10)})`],
    ['Total Holds Placed', String(total)],
    ['Picked Up', String(pickedUp)],
    ['Expired (No-Show)', String(expired)],
    ['Conversion Rate', total > 0 ? `${Math.round((pickedUp / total) * 100)}%` : '0%'],
    ['No-Show Rate', total > 0 ? `${Math.round((expired / total) * 100)}%` : '0%'],
    ['Total Revenue', formatCAD(totalRevCents)],
  ]

  const salesHeader = ['Product (Snapshot)', 'Qty', 'Total Sale Price (CAD)', 'Customer Phone', 'Sold At']
  const salesData = salesRows.map((r) => [
    r.productNameSnapshot,
    String(r.holdQuantity ?? 1),
    formatCAD(r.salePriceCentsSnapshot),
    r.customerPhoneSnapshot,
    r.soldAt.toISOString(),
  ])

  const csv = [
    toCSV([summaryHeader, ...summaryData]),
    '',
    'Sales Detail',
    toCSV([salesHeader, ...salesData]),
  ].join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="jays-shop-reports-${period}-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  })
}
