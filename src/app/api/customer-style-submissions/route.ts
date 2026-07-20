import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

async function saveImage(file: File) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${nanoid(12)}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'customer-style')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/customer-style/${fileName}`
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const customerName = (formData.get('customerName') as string | null) ?? ''
    const customerEmail = (formData.get('customerEmail') as string | null) ?? ''
    const customerPhone = (formData.get('customerPhone') as string | null) ?? ''
    const instagramHandle = (formData.get('instagramHandle') as string | null) ?? ''
    const caption = (formData.get('caption') as string | null) ?? ''
    const files = formData.getAll('images') as File[]

    const validFiles = files.filter(f => f instanceof File && f.size > 0).slice(0, 2)
    if (validFiles.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 })
    }

    for (const file of validFiles) {
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Image exceeds 10MB limit' }, { status: 400 })
      }
      if (!IMAGE_TYPES.has(file.type)) {
        return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 })
      }
    }

    const imageUrls = await Promise.all(validFiles.map(saveImage))

    const submission = await prisma.customerStyleSubmission.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        instagramHandle,
        caption,
        status: 'PENDING',
        images: {
          create: imageUrls.map((url, idx) => ({ imageUrl: url, sortOrder: idx })),
        },
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (err: any) {
    console.error('customer style submission error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'APPROVED'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

    const submissions = await prisma.customerStyleSubmission.findMany({
      where: { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json(submissions)
  } catch (err: any) {
    console.error('customer style submissions error:', err)
    return NextResponse.json({ error: err.message || 'Fetch failed' }, { status: 500 })
  }
}
