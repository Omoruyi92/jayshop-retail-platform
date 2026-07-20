import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function saveImage(file: File) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${nanoid(10)}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'customer-photos')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/customer-photos/${fileName}`
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const productId = formData.get('productId') as string
    const customerName = (formData.get('customerName') as string | null) ?? ''
    const instagramHandle = (formData.get('instagramHandle') as string | null) ?? ''
    const caption = (formData.get('caption') as string | null) ?? ''
    const file = formData.get('image') as File | null

    if (!productId || !file || file.size === 0) {
      return NextResponse.json({ error: 'Product and photo are required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const imageUrl = await saveImage(file)

    const photo = await prisma.customerPhoto.create({
      data: {
        productId,
        imageUrl,
        customerName,
        instagramHandle,
        caption,
        status: 'PENDING',
      },
    })

    return NextResponse.json(photo)
  } catch (err: any) {
    console.error('customer photo upload error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
