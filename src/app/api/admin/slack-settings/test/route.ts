import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth'

export async function POST() {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    const settings = await prisma.slackSettings.findFirst()
    if (!settings?.webhookUrl) {
      return NextResponse.json({ error: 'No webhook configured' }, { status: 400 })
    }
    const res = await fetch(settings.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [{
          type: 'section',
          text: { type: 'mrkdwn', text: '✅ *Jays Shop Slack integration is working!* This is a test ping from your admin dashboard.' },
        }],
      }),
    })
    if (!res.ok) return NextResponse.json({ error: 'Slack returned error' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[slack-test] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
