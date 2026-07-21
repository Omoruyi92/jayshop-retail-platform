import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireRole, AdminSession } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'

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

// Videos skip the image optimization pipeline and are stored as-is, same
// pattern as HeroSlide video handling.
async function uploadVideo(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'mp4'
  const fileName = `${nanoid(10)}.${rawExt}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'styles')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), Buffer.from(bytes))
  return `/uploads/styles/${fileName}`
}

// Admin: returns ALL style categories (active + inactive), for management
// in the admin dashboard.
export async function GET(req: Request) {
  const { error } = await requireRole(req, 'styles:read')
  if (error) return error

  const styles = await prisma.styleCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: true } },
      products: {
        orderBy: { sortOrder: 'asc' },
        include: {
          product: { select: { id: true, name: true, slug: true, imageUrl: true } },
        },
      },
    },
  })

  return NextResponse.json({ styles })
}

// Admin: create a new style category. Accepts multipart/form-data so a
// cover image (required) and optional hero image/video can be uploaded in
// the same request, following the Player/HeroSlide upload convention.
export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'styles:write')
  if (error) return error

  try {
    const contentType = req.headers.get('content-type') || ''
    let name = ''
    let description = ''
    let heroOverlayText = ''
    let heroCtaLabel = ''
    let heroCtaUrl = ''
    let isActive = true
    let coverImageUrl = ''
    let heroImageUrl = ''
    let heroVideoUrl = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      name = ((formData.get('name') as string) || '').trim()
      description = (formData.get('description') as string) || ''
      heroOverlayText = (formData.get('heroOverlayText') as string) || ''
      heroCtaLabel = (formData.get('heroCtaLabel') as string) || ''
      heroCtaUrl = (formData.get('heroCtaUrl') as string) || ''
      const isActiveRaw = formData.get('isActive')
      if (isActiveRaw !== null) isActive = isActiveRaw === 'true'

      coverImageUrl = (formData.get('coverImageUrl') as string) || ''
      const coverImageFile = formData.get('coverImageFile') as File | null
      if (coverImageFile && coverImageFile.size > 0) {
        coverImageUrl = await uploadImage(coverImageFile)
      }

      heroImageUrl = (formData.get('heroImageUrl') as string) || ''
      const heroImageFile = formData.get('heroImageFile') as File | null
      if (heroImageFile && heroImageFile.size > 0) {
        heroImageUrl = await uploadImage(heroImageFile)
      }

      heroVideoUrl = (formData.get('heroVideoUrl') as string) || ''
      const heroVideoFile = formData.get('heroVideoFile') as File | null
      if (heroVideoFile && heroVideoFile.size > 0) {
        if (!VIDEO_TYPES.has(heroVideoFile.type)) {
          return NextResponse.json({ error: 'Unsupported video format' }, { status: 400 })
        }
        heroVideoUrl = await uploadVideo(heroVideoFile)
      }
    } else {
      const body = await req.json()
      name = ((body.name as string) || '').trim()
      description = (body.description as string) || ''
      heroOverlayText = (body.heroOverlayText as string) || ''
      heroCtaLabel = (body.heroCtaLabel as string) || ''
      heroCtaUrl = (body.heroCtaUrl as string) || ''
      if (typeof body.isActive === 'boolean') isActive = body.isActive
      coverImageUrl = (body.coverImageUrl as string) || ''
      heroImageUrl = (body.heroImageUrl as string) || ''
      heroVideoUrl = (body.heroVideoUrl as string) || ''
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!coverImageUrl) {
      return NextResponse.json({ error: 'coverImageUrl or coverImageFile is required' }, { status: 400 })
    }

    const baseSlug = slugify(name)
    let slug = baseSlug
    let n = 1
    while (await prisma.styleCategory.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    const count = await prisma.styleCategory.count()

    const style = await prisma.styleCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        coverImageUrl,
        heroImageUrl: heroImageUrl || null,
        heroVideoUrl: heroVideoUrl || null,
        heroOverlayText: heroOverlayText || null,
        heroCtaLabel: heroCtaLabel || null,
        heroCtaUrl: heroCtaUrl || null,
        sortOrder: count,
        isActive,
      },
    })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'style-category.created',
      entityType: 'StyleCategory',
      entityId: style.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: { name, slug },
      req,
    })

    return NextResponse.json({ style }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
