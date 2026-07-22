import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      blobTokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN,
      blobStoreIdPresent: !!process.env.BLOB_STORE_ID,
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    })
  } catch (err) {
    return NextResponse.json({ status: 'error', db: 'disconnected' }, { status: 500 })
  }
}
