import { prisma } from '@/lib/prisma'
import { resolveHold } from '@/lib/holds/resolveHold'
import { sendSlackExpiry } from '@/lib/slack'

export interface ExpireResult {
  id: string
  code: string
  status: 'expired' | 'error'
}

export async function expireAllOverdueHolds(): Promise<{
  processed: number
  results: ExpireResult[]
}> {
  const expiredHolds = await prisma.hold.findMany({
    where: { status: 'ACTIVE', expiresAt: { lte: new Date() } },
    include: { product: true, customer: true },
  })

  const results: ExpireResult[] = []
  for (const hold of expiredHolds) {
    try {
      await resolveHold(hold.id, 'EXPIRED')
      await sendSlackExpiry({
        reservationCode: hold.reservationCode,
        productName: hold.product.name,
        priceCents: hold.product.priceCents,
        customerName: hold.customer.fullName,
        customerPhone: hold.customer.phone,
      })
      results.push({ id: hold.id, code: hold.reservationCode, status: 'expired' })
    } catch (err) {
      console.error(`[expireHolds] Failed to expire hold ${hold.id}:`, err)
      results.push({ id: hold.id, code: hold.reservationCode, status: 'error' })
    }
  }

  return { processed: results.length, results }
}
