import { NextResponse } from 'next/server'
import { expireAllOverdueHolds } from '@/lib/holds/expireHolds'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const result = await expireAllOverdueHolds()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron/expire-holds] Failed to run expiry:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
