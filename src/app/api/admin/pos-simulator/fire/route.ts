import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize.server'
import { getOrCreateDevApiKey } from '@/lib/pos/devKey'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/pos-simulator/fire
 * Body: mirrors the public POS transaction contract minus auth — the
 * simulator resolves a dev API key server-side and forwards the exact
 * same request shape to /api/pos/transaction, so this exercises the real
 * webhook end-to-end (auth, dedupe, transaction logic, real-time push).
 */
export async function POST(req: Request) {
  const { error } = await requireRole(req, 'pos-keys:manage')
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rawKey = await getOrCreateDevApiKey()

  const origin = new URL(req.url).origin
  const res = await fetch(`${origin}/api/pos/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rawKey}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))

  return NextResponse.json(data, { status: res.status })
}
