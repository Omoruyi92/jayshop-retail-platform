import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/media/server/upload.server'

export const dynamic = 'force-dynamic'

async function writeUpload(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const { buffer, ext, contentType } = await optimizeImageBuffer(Buffer.from(bytes), rawExt)
  const fileName = `${nanoid(10)}.${ext}`
  return saveUploadedFile(buffer, fileName, contentType)
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

    revalidatePath('/gallery')

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

  const { searchParams } = new URL(req.url)
  const hardDelete = searchParams.get('hard') === 'true'
  const admin = session.user as AdminSession['user']

  if (hardDelete) {
    // Permanent removal — used by the admin "Delete" action (confirmed via
    // a confirmation dialog client-side) as opposed to the reversible
    // "Archive" action below. Also removes the underlying blob file.
    await prisma.storeGalleryImage.delete({ where: { id } })
    await deleteUploadedFile(existing.imageUrl).catch(() => {
      // Non-fatal — the DB record is already gone; an orphaned blob file
      // shouldn't block the delete from completing.
    })

    await recordAudit({
      tx: prisma,
      action: 'gallery.deleted',
      entityType: 'StoreGalleryImage',
      entityId: id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: existing,
      req,
    })

    revalidatePath('/gallery')

    return NextResponse.json({ success: true })
  }

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

  revalidatePath('/gallery')

  return NextResponse.json({ success: true })
}
