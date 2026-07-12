import { prisma } from '@/lib/prisma'
import { resolveHold } from './resolveHold'

/**
 * Automatically expires any ACTIVE holds whose expiresAt has passed.
 * This is called by list endpoints before returning data to ensure
 * clients never see stale "ACTIVE" holds that are actually expired.
 *
 * Runs each expiration independently (with try/catch) so one failure
 * does not block the rest or the original request.
 */
export async function autoExpireOverdueHolds(): Promise<{
  expired: number
  errors: number
}> {
  const overdueHolds = await prisma.hold.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: new Date() },
    },
    select: { id: true, reservationCode: true },
  })

  if (overdueHolds.length === 0) {
    return { expired: 0, errors: 0 }
  }

  let expired = 0
  let errors = 0

  for (const hold of overdueHolds) {
    try {
      await resolveHold(hold.id, 'EXPIRED')
      expired++
    } catch (err) {
      console.error(
        `[autoExpireOverdueHolds] Failed to expire hold ${hold.id} (${hold.reservationCode}):`,
        (err as Error).message
      )
      errors++
    }
  }

  return { expired, errors }
}
