import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Lightweight DB health check — used by the client-side connection banner
// and can be hit manually / by uptime monitors to confirm Postgres is reachable.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 503 }
    )
  }
}
