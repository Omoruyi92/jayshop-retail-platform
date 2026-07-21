import { NextResponse } from 'next/server'
import { join } from 'path'
import { unlink } from 'fs/promises'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'

export const dynamic = 'force-dynamic'

async function removeFile(url: string) {
  try {
    const filePath = join(process.cwd(), 'public', url)
    await unlink(filePath)
  } catch {
    // ignore
  }
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'gallery:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'PENDING'

  const submissions = await prisma.customerStyleSubmission.findMany({
    where: { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' },
    orderBy: { createdAt: 'desc' },
    include: { images: { orderBy: { sortOrder: 'asc' } }, product: { select: { id: true, name: true, slug: true, imageUrl: true } } },
  })

  return NextResponse.json(submissions)
}

export async function PATCH(req: Request) {
  const { error } = await requireRole(req, 'gallery:write')
  if (error) return error

  try {
    const body = await req.json()
    const { id, status, caption } = body

    if (!id || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const data: any = { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' }
    if (typeof caption === 'string') data.caption = caption

    const submission = await prisma.customerStyleSubmission.update({
      where: { id },
      data,
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json(submission)
  } catch (err: any) {
    console.error('submission review error:', err)
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRole(req, 'gallery:write')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }

  try {
    const submission = await prisma.customerStyleSubmission.findUnique({
      where: { id },
      include: { images: true },
    })

    if (submission) {
      await Promise.all(submission.images.map(img => removeFile(img.imageUrl)))
      await prisma.customerStyleSubmission.delete({ where: { id } })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('submission delete error:', err)
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
