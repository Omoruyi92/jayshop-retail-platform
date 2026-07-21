import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireRole, AdminSession } from '@/lib/auth/authorize'
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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole(req, 'gallery:write')
  if (error) return error

  const { id } = params
  const existing = await prisma.storeGalleryImage.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  try {
    const formData = await req.formData()
    const title = (formData.get('title') as string)?.trim()
    const description = (formData.get('description') as string) ?? existing.description
    const category = (formData.get('category') as string) ?? existing.category
    const sortOrderRaw = formData.get('sortOrder') as string | null
    const sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : existing.sortOrder
    const status = (formData.get('status') as string) ?? existing.status
    const imageFile = formData.get('imageFile') as File | null

    let imageUrl = existing.imageUrl
    if (imageFile && imageFile.size > 0) {
      imageUrl = await writeUpload(imageFile)
    }

    const admin = session.user as AdminSession['user']
    const updated = await prisma.storeGalleryImage.update({
      where: { id },
      data: {
        title: title || existing.title,
        description,
        category,
        imageUrl,
        sortOrder,
        status,
      },
    })

    await recordAudit({
      tx: prisma,
      action: 'gallery.updated',
      entityType: 'StoreGalleryImage',
      entityId: id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: existing,
      after: updated,
      req,
    })

    return NextResponse.json({ image: updated })
  } catch (e) {
    console.error('Gallery update error:', e)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireRole(req, 'gallery:write')
  if (error) return error

  const { id } = params
  const existing = await prisma.storeGalleryImage.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const admin = session.user as AdminSession['user']
  await prisma.storeGalleryImage.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  await recordAudit({
    tx: prisma,
    action: 'gallery.archived',
    entityType: 'StoreGalleryImage',
    entityId: id,
    actorId: admin.adminId,
    actorType: 'admin',
    actorEmail: admin.email,
    before: existing,
    after: { status: 'ARCHIVED' },
    req,
  })

  return NextResponse.json({ success: true })
}
