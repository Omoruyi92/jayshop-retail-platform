import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/media/upload'
import { parseFormData, parseJsonBody, apiErrorResponse, badRequest } from '@/lib/api/request'
import { ensureGalleryHeroTable } from '@/lib/gallery/ensureGalleryHeroTable'

// Admin CRUD for the Gallery page hero images (GalleryHeroImage). This is a
// standalone model/route independent from the HeroSlide/SlideScope system
// (Home/Shop/Style/Players heroes) — kept separate so this feature can be
// iterated on without any risk to that stability-verified system.

export const dynamic = 'force-dynamic'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const { buffer, ext, contentType } = await optimizeImageBuffer(Buffer.from(bytes), rawExt)
  const fileName = `${nanoid(12)}.${ext}`
  return saveUploadedFile(buffer, fileName, contentType, 'gallery-hero')
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'gallery-hero:read')
  if (error) return error

  await ensureGalleryHeroTable()

  const images = await prisma.galleryHeroImage.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(images)
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'gallery-hero:write')
  if (error) return error

  try {
    await ensureGalleryHeroTable()
    const formData = await parseFormData(req)
    const altText = (formData.get('altText') as string | null)?.trim() || null
    const file = formData.get('file') as File | null

    if (!file || file.size === 0) {
      return badRequest('Image file is required')
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return badRequest('Image exceeds size limit')
    }
    if (!IMAGE_TYPES.has(file.type)) {
      return badRequest('Unsupported image format')
    }

    const count = await prisma.galleryHeroImage.count()
    const imageUrl = await saveFile(file)

    const admin = session.user as AdminSession['user']
    const image = await prisma.galleryHeroImage.create({
      data: {
        imageUrl,
        altText,
        sortOrder: count,
        isActive: true,
      },
    })

    await recordAudit({
      tx: prisma,
      action: 'gallery-hero.created',
      entityType: 'GalleryHeroImage',
      entityId: image.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: { imageUrl, altText, sortOrder: image.sortOrder },
      req,
    })

    revalidatePath('/gallery')

    return NextResponse.json(image, { status: 201 })
  } catch (err) {
    return apiErrorResponse(err, 'Upload failed')
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireRole(req, 'gallery-hero:write')
  if (error) return error

  try {
    await ensureGalleryHeroTable()
    const body = await parseJsonBody<{ id?: string; isActive?: boolean; sortOrder?: number; altText?: string }>(req)
    const { id, isActive, sortOrder, altText } = body

    if (!id) {
      return badRequest('ID required')
    }

    const existing = await prisma.galleryHeroImage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const data: { isActive?: boolean; sortOrder?: number; altText?: string } = {}
    if (typeof isActive === 'boolean') data.isActive = isActive
    if (typeof sortOrder === 'number') data.sortOrder = sortOrder
    if (typeof altText === 'string') data.altText = altText

    const image = await prisma.galleryHeroImage.update({ where: { id }, data })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'gallery-hero.updated',
      entityType: 'GalleryHeroImage',
      entityId: id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: existing,
      after: image,
      req,
    })

    revalidatePath('/gallery')

    return NextResponse.json(image)
  } catch (err) {
    return apiErrorResponse(err, 'Update failed')
  }
}

export async function DELETE(req: Request) {
  const { session, error } = await requireRole(req, 'gallery-hero:write')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }

  try {
    await ensureGalleryHeroTable()
    const image = await prisma.galleryHeroImage.findUnique({ where: { id } })
    if (image) {
      await deleteUploadedFile(image.imageUrl)
      await prisma.galleryHeroImage.delete({ where: { id } })

      const admin = session.user as AdminSession['user']
      await recordAudit({
        tx: prisma,
        action: 'gallery-hero.deleted',
        entityType: 'GalleryHeroImage',
        entityId: id,
        actorId: admin.adminId,
        actorType: 'admin',
        actorEmail: admin.email,
        before: image,
        req,
      })

      revalidatePath('/gallery')
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiErrorResponse(err, 'Delete failed')
  }
}
