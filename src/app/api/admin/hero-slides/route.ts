import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/media/upload'
import { parseFormData, parseJsonBody, apiErrorResponse, badRequest } from '@/lib/api/request'
import { ensureGalleryScope } from '@/lib/hero/ensureGalleryScope'

export const dynamic = 'force-dynamic'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

// Maps a HeroSlide scope to the public page(s) it feeds, so admin
// create/update/delete actions can revalidate the exact customer-facing
// route that renders that hero.
function scopeToPaths(scope: string): string[] {
  switch (scope) {
    case 'HOME':
      return ['/']
    case 'SHOP':
      return ['/shop']
    case 'STYLE_LANDING':
      return ['/shop-by-style']
    case 'PLAYERS':
      return ['/players']
    case 'GALLERY':
      return ['/gallery']
    default:
      return []
  }
}

function mediaType(mime: string): 'IMAGE' | 'VIDEO' {
  if (VIDEO_TYPES.has(mime)) return 'VIDEO'
  return 'IMAGE'
}

async function saveFile(file: File, scope: 'home' | 'shop' | 'style_landing' | 'players' | 'gallery') {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const isImage = mediaType(file.type) === 'IMAGE'
  const { buffer, ext, contentType } = isImage
    ? await optimizeImageBuffer(Buffer.from(bytes), rawExt)
    : { buffer: Buffer.from(bytes), ext: rawExt, contentType: file.type }
  const fileName = `${nanoid(12)}.${ext}`
  return saveUploadedFile(buffer, fileName, contentType, `hero-slides/${scope}`)
}

async function removeFile(url: string) {
  await deleteUploadedFile(url)
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'gallery:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope')?.toUpperCase() as 'HOME' | 'SHOP' | 'STYLE_LANDING' | 'PLAYERS' | 'GALLERY' | null
  if (!scope || scope === 'GALLERY') await ensureGalleryScope()

  const where: any = {}
  if (scope) where.scope = scope

  const slides = await prisma.heroSlide.findMany({
    where,
    orderBy: [{ scope: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(slides)
}

export async function POST(req: Request) {
  const { error } = await requireRole(req, 'gallery:write')
  if (error) return error

  try {
    const formData = await parseFormData(req)
    const scopeRaw = (formData.get('scope') as string)?.toUpperCase()
    const altText = (formData.get('altText') as string | null) ?? ''
    const file = formData.get('file') as File | null

    if (!['HOME', 'SHOP', 'STYLE_LANDING', 'PLAYERS', 'GALLERY'].includes(scopeRaw)) {
      return NextResponse.json({ error: 'Scope must be HOME, SHOP, STYLE_LANDING, PLAYERS, or GALLERY' }, { status: 400 })
    }
    const scope = scopeRaw.toLowerCase() as 'home' | 'shop' | 'style_landing' | 'players' | 'gallery'
    if (scopeRaw === 'GALLERY') await ensureGalleryScope()

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Slide file is required' }, { status: 400 })
    }

    const type = mediaType(file.type)
    const maxSize = type === 'VIDEO' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({ error: `${type === 'VIDEO' ? 'Video' : 'Image'} exceeds size limit` }, { status: 400 })
    }
    if (type === 'IMAGE' && !IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 })
    }
    if (type === 'VIDEO' && !VIDEO_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported video format' }, { status: 400 })
    }

    const count = await prisma.heroSlide.count({ where: { scope: scopeRaw as 'HOME' | 'SHOP' | 'STYLE_LANDING' | 'PLAYERS' | 'GALLERY' } })
    const url = await saveFile(file, scope)

    const slide = await prisma.heroSlide.create({
      data: {
        scope: scopeRaw as 'HOME' | 'SHOP' | 'STYLE_LANDING' | 'PLAYERS' | 'GALLERY',
        mediaType: type,
        url,
        altText,
        sortOrder: count,
        active: true,
      },
    })

    for (const path of scopeToPaths(scopeRaw)) revalidatePath(path)

    return NextResponse.json(slide, { status: 201 })
  } catch (err) {
    return apiErrorResponse(err, 'Upload failed')
  }
}

export async function PATCH(req: Request) {
  const { error } = await requireRole(req, 'gallery:write')
  if (error) return error

  try {
    const body = await parseJsonBody<{ id?: string; active?: boolean; sortOrder?: number; altText?: string }>(req)
    const { id, active, sortOrder, altText } = body

    if (!id) {
      return badRequest('ID required')
    }

    const data: any = {}
    if (typeof active === 'boolean') data.active = active
    if (typeof sortOrder === 'number') data.sortOrder = sortOrder
    if (typeof altText === 'string') data.altText = altText

    const slide = await prisma.heroSlide.update({ where: { id }, data })

    for (const path of scopeToPaths(slide.scope)) revalidatePath(path)

    return NextResponse.json(slide)
  } catch (err) {
    return apiErrorResponse(err, 'Update failed')
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
    const slide = await prisma.heroSlide.findUnique({ where: { id } })
    if (slide) {
      await removeFile(slide.url)
      if (slide.mobileUrl) await removeFile(slide.mobileUrl)
      await prisma.heroSlide.delete({ where: { id } })
      for (const path of scopeToPaths(slide.scope)) revalidatePath(path)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiErrorResponse(err, 'Delete failed')
  }
}
