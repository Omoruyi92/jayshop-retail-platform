import { NextResponse } from 'next/server'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'

export const dynamic = 'force-dynamic'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

function mediaType(mime: string): 'IMAGE' | 'VIDEO' {
  if (VIDEO_TYPES.has(mime)) return 'VIDEO'
  return 'IMAGE'
}

async function saveFile(file: File, scope: 'home' | 'shop' | 'style_landing') {
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const isImage = mediaType(file.type) === 'IMAGE'
  const { buffer, ext } = isImage
    ? await optimizeImageBuffer(Buffer.from(bytes), rawExt)
    : { buffer: Buffer.from(bytes), ext: rawExt }
  const fileName = `${nanoid(12)}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'hero-slides', scope)
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/hero-slides/${scope}/${fileName}`
}

async function removeFile(url: string) {
  try {
    const filePath = join(process.cwd(), 'public', url)
    await unlink(filePath)
  } catch {
    // ignore
  }
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'gallery:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope')?.toUpperCase() as 'HOME' | 'SHOP' | 'STYLE_LANDING' | null

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
    const formData = await req.formData()
    const scopeRaw = (formData.get('scope') as string)?.toUpperCase()
    const altText = (formData.get('altText') as string | null) ?? ''
    const file = formData.get('file') as File | null

    if (!['HOME', 'SHOP', 'STYLE_LANDING'].includes(scopeRaw)) {
      return NextResponse.json({ error: 'Scope must be HOME, SHOP, or STYLE_LANDING' }, { status: 400 })
    }
    const scope = scopeRaw.toLowerCase() as 'home' | 'shop' | 'style_landing'

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

    const count = await prisma.heroSlide.count({ where: { scope: scopeRaw as 'HOME' | 'SHOP' | 'STYLE_LANDING' } })
    const url = await saveFile(file, scope)

    const slide = await prisma.heroSlide.create({
      data: {
        scope: scopeRaw as 'HOME' | 'SHOP' | 'STYLE_LANDING',
        mediaType: type,
        url,
        altText,
        sortOrder: count,
        active: true,
      },
    })

    return NextResponse.json(slide, { status: 201 })
  } catch (err: any) {
    console.error('hero slide create error:', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const { error } = await requireRole(req, 'gallery:write')
  if (error) return error

  try {
    const body = await req.json()
    const { id, active, sortOrder, altText } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const data: any = {}
    if (typeof active === 'boolean') data.active = active
    if (typeof sortOrder === 'number') data.sortOrder = sortOrder
    if (typeof altText === 'string') data.altText = altText

    const slide = await prisma.heroSlide.update({ where: { id }, data })
    return NextResponse.json(slide)
  } catch (err: any) {
    console.error('hero slide patch error:', err)
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 })
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
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('hero slide delete error:', err)
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
