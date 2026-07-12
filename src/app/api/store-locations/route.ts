import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const locations = await prisma.storeLocation.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      section: true,
      gate: true,
      isMainStore: true,
      isPickupQueue: true,
    },
  })

  return NextResponse.json({ locations })
}
