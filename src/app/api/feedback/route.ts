export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/feedback — submit site feedback (name optional, message required)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const feedback = await prisma.siteFeedback.create({
      data: {
        name: name?.trim() ? name.trim() : null,
        message: message.trim(),
      },
    })

    return NextResponse.json({ feedback }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
