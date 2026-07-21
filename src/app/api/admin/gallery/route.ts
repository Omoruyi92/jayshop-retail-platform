import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'

export const dynamic = 'force-dynamic'

async function writeUpload(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const { buffer, ext } = await optimizeImageBuffer(Buffer.from(bytes), rawExt)
  const fileName = `${nanoid(10)}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/${fileName}`
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'gallery:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const includeArchived = searchParams.get('includeArchived') === 'true'

  const images = await prisma.storeGalleryImage.findMany({
    where: includeArchived ? {} : { status: { not: 'ARCHIVED' } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ images })
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'gallery:write')
  if (error) return error

  try {
    const formData = await req.formData()
    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string) ?? ''
    const category = (formData.get('category') as string) ?? 'General'
    const sortOrder = parseInt((formData.get('sortOrder') as string) ?? '0', 10)
    const imageFile = formData.get('imageFile') as File | null

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    let imageUrl = ''
    if (imageFile && imageFile.size > 0) {
      imageUrl = await writeUpload(imageFile)
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 })
    }

    const admin = session.user as AdminSession['user']
    const image = await prisma.storeGalleryImage.create({
      data: {
        title,
        description,
        category,
        imageUrl,
        sortOrder,
        createdBy: admin.email ?? '',
      },
    })

    await recordAudit({
      tx: prisma,
      action: 'gallery.created',
      entityType: 'StoreGalleryImage',
      entityId: image.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: { title, category, imageUrl, sortOrder },
      req,
    })

    return NextResponse.json({ image }, { status: 201 })
  } catch (e) {
    console.error('Gallery create error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
