import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    const settings = await prisma.slackSettings.findFirst()
    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[slack-settings] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    const { webhookUrl, channelName, interactiveEnabled } = await req.json()
    const existing = await prisma.slackSettings.findFirst()
    const settings = existing
      ? await prisma.slackSettings.update({ where: { id: existing.id }, data: { webhookUrl, channelName, interactiveEnabled } })
      : await prisma.slackSettings.create({ data: { webhookUrl, channelName, interactiveEnabled } })
    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[slack-settings] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
