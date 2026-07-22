import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'
import { saveUploadedFile } from '@/lib/media/upload'

export const dynamic = 'force-dynamic'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

async function saveImage(file: File) {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const { buffer, ext, contentType } = await optimizeImageBuffer(Buffer.from(bytes), rawExt)
  const fileName = `${nanoid(12)}.${ext}`
  return saveUploadedFile(buffer, fileName, contentType, 'customer-style')
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const productId = (formData.get('productId') as string | null) ?? ''
    const customerName = (formData.get('customerName') as string | null) ?? ''
    const customerEmail = (formData.get('customerEmail') as string | null) ?? ''
    const customerPhone = (formData.get('customerPhone') as string | null) ?? ''
    const instagramHandle = (formData.get('instagramHandle') as string | null) ?? ''
    const caption = (formData.get('caption') as string | null) ?? ''
    const files = formData.getAll('images') as File[]

    if (!productId) {
      return NextResponse.json({ error: 'Product is required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

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
        productId,
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
    const productId = searchParams.get('productId')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

    const where: any = { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' }
    if (productId) where.productId = productId

    const submissions = await prisma.customerStyleSubmission.findMany({
      where,
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
