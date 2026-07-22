import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAllStoreLocations } from '@/lib/store-locations'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Self-heal: ensure all 12 predefined locations exist/are active
  // (idempotent, never deletes existing rows).
  await ensureAllStoreLocations()

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
