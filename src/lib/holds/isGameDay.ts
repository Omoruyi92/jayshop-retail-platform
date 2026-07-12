import { prisma } from '@/lib/prisma'

/**
 * Returns true if the given date (compared by UTC calendar date) matches a
 * GameDay row. GameDay.date is stored as @db.Date (date-only, no time).
 */
export async function isGameDay(date: Date): Promise<boolean> {
  const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const gameDay = await prisma.gameDay.findUnique({
    where: { date: startOfDay },
    select: { id: true },
  })
  return gameDay !== null
}
