import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'
import { parseFormData, parseJsonBody, apiErrorResponse, badRequest } from '@/lib/api/request'

export const dynamic = 'force-dynamic'

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const { buffer, ext } = await optimizeImageBuffer(Buffer.from(bytes), rawExt)
  const fileName = `${nanoid(10)}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'styles')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/styles/${fileName}`
}

async function uploadVideo(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'mp4'
  const fileName = `${nanoid(10)}.${rawExt}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'styles')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), Buffer.from(bytes))
  return `/uploads/styles/${fileName}`
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'styles:write')
  if (error) return error

  try {
    const existing = await prisma.styleCategory.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Style category not found' }, { status: 404 })
    }

    const contentType = req.headers.get('content-type') || ''
    const data: Record<string, unknown> = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await parseFormData(req)

      const name = formData.get('name')
      if (typeof name === 'string' && name.trim()) {
        data.name = name.trim()
        const baseSlug = slugify(name)
        if (baseSlug && baseSlug !== existing.slug) {
          let slug = baseSlug
          let n = 1
          while (await prisma.styleCategory.findFirst({ where: { slug, id: { not: existing.id } } })) {
            slug = `${baseSlug}-${n++}`
          }
          data.slug = slug
        }
      }

      for (const key of ['description', 'heroOverlayText', 'heroCtaLabel', 'heroCtaUrl', 'coverImageUrl', 'heroImageUrl', 'heroVideoUrl']) {
        const v = formData.get(key)
        if (v !== null) data[key] = (v as string) || null
      }

      const isActiveRaw = formData.get('isActive')
      if (isActiveRaw !== null) data.isActive = isActiveRaw === 'true'
      const sortOrderRaw = formData.get('sortOrder')
      if (sortOrderRaw !== null) data.sortOrder = Number(sortOrderRaw)

      const coverImageFile = formData.get('coverImageFile') as File | null
      if (coverImageFile && coverImageFile.size > 0) {
        data.coverImageUrl = await uploadImage(coverImageFile)
      }
      const heroImageFile = formData.get('heroImageFile') as File | null
      if (heroImageFile && heroImageFile.size > 0) {
        data.heroImageUrl = await uploadImage(heroImageFile)
      }
      const heroVideoFile = formData.get('heroVideoFile') as File | null
      if (heroVideoFile && heroVideoFile.size > 0) {
        if (!VIDEO_TYPES.has(heroVideoFile.type)) {
          return badRequest('Unsupported video format')
        }
        data.heroVideoUrl = await uploadVideo(heroVideoFile)
      }
    } else {
      const body = await parseJsonBody<Record<string, unknown>>(req)

      // Move up/down: swap sortOrder with the adjacent sibling.
      if (body.move === 'up' || body.move === 'down') {
        const siblings = await prisma.styleCategory.findMany({ orderBy: { sortOrder: 'asc' } })
        const idx = siblings.findIndex((s) => s.id === existing.id)
        const swapIdx = body.move === 'up' ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= siblings.length) {
          return NextResponse.json({ style: existing })
        }
        const other = siblings[swapIdx]
        await prisma.$transaction([
          prisma.styleCategory.update({ where: { id: existing.id }, data: { sortOrder: other.sortOrder } }),
          prisma.styleCategory.update({ where: { id: other.id }, data: { sortOrder: existing.sortOrder } }),
        ])
        const updated = await prisma.styleCategory.findUnique({ where: { id: existing.id } })
        revalidatePath('/shop-by-style')
        return NextResponse.json({ style: updated })
      }

      if (typeof body.name === 'string' && body.name.trim()) {
        data.name = body.name.trim()
        const baseSlug = slugify(body.name)
        if (baseSlug && baseSlug !== existing.slug) {
          let slug = baseSlug
          let n = 1
          while (await prisma.styleCategory.findFirst({ where: { slug, id: { not: existing.id } } })) {
            slug = `${baseSlug}-${n++}`
          }
          data.slug = slug
        }
      }
      for (const key of ['description', 'heroOverlayText', 'heroCtaLabel', 'heroCtaUrl', 'coverImageUrl', 'heroImageUrl', 'heroVideoUrl']) {
        if (body[key] !== undefined) data[key] = body[key] || null
      }
      if (typeof body.isActive === 'boolean') data.isActive = body.isActive
      if (typeof body.sortOrder === 'number') data.sortOrder = body.sortOrder
    }

    const style = await prisma.styleCategory.update({ where: { id: existing.id }, data })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'style-category.updated',
      entityType: 'StyleCategory',
      entityId: style.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: data,
      req,
    })

    revalidatePath('/shop-by-style')
    revalidatePath(`/shop-by-style/${existing.slug}`)
    if (typeof data.slug === 'string' && data.slug !== existing.slug) {
      revalidatePath(`/shop-by-style/${data.slug}`)
    }

    return NextResponse.json({ style })
  } catch (err) {
    return apiErrorResponse(err)
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'styles:write')
  if (error) return error

  try {
    const existing = await prisma.styleCategory.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Style category not found' }, { status: 404 })
    }

    await prisma.styleCategory.delete({ where: { id: params.id } })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'style-category.deleted',
      entityType: 'StyleCategory',
      entityId: params.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: { name: existing.name, slug: existing.slug },
      req,
    })

    revalidatePath('/shop-by-style')
    revalidatePath(`/shop-by-style/${existing.slug}`)

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiErrorResponse(err)
  }
}
