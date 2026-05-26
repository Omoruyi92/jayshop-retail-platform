import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { resolveHold } from '@/lib/holds/resolveHold'

export const dynamic = 'force-dynamic'

function verifySlackSignature(body: string, timestamp: string, signature: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET
  if (!secret) return false
  const base = `v0:${timestamp}:${body}`
  const expected = 'v0=' + crypto.createHmac('sha256', secret).update(base).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const timestamp = req.headers.get('x-slack-request-timestamp') ?? ''
  const signature = req.headers.get('x-slack-signature') ?? ''

  if (!verifySlackSignature(rawBody, timestamp, signature)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const params = new URLSearchParams(rawBody)
  const payload = JSON.parse(params.get('payload') ?? '{}')
  const action = payload.actions?.[0]
  if (!action?.value) return NextResponse.json({ ok: true })

  const [type, reservationCode] = action.value.split('_') as [string, string]
  const finalStatus = type === 'pickup' ? 'PICKED_UP' : 'RELEASED'

  const hold = await prisma.hold.findUnique({ where: { reservationCode } })
  if (hold?.status === 'ACTIVE') {
    await resolveHold(hold.id, finalStatus as 'PICKED_UP' | 'RELEASED')
  }

  return NextResponse.json({ ok: true })
}
