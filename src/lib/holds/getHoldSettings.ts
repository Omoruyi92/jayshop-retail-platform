import { prisma } from '@/lib/prisma'
import type { HoldSettings } from '@prisma/client'

/**
 * Returns the singleton HoldSettings row, lazily creating it with defaults
 * if it doesn't exist yet (first read after migration).
 */
export async function getHoldSettings(): Promise<HoldSettings> {
  const existing = await prisma.holdSettings.findFirst()
  if (existing) return existing

  return prisma.holdSettings.create({
    data: {
      enable48HourHold: true,
      standardHoldHours: 3,
      extendedHoldHours: 48,
    },
  })
}
