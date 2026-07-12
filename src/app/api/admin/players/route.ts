import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireRole, AdminSession } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'players:read')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const includeArchived = searchParams.get('includeArchived') === 'true'

  const players = await prisma.player.findMany({
    where: includeArchived ? {} : { status: { not: 'ARCHIVED' } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      products: {
        orderBy: { sortOrder: 'asc' },
        include: { product: { select: { id: true, name: true, slug: true, imageUrl: true, priceCents: true } } },
      },
    },
  })

  return NextResponse.json({ players })
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'players:write')
  if (error) return error

  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const jerseyNumber = (formData.get('jerseyNumber') as string) ?? ''
    const position = (formData.get('position') as string) ?? ''
    const bio = (formData.get('bio') as string) ?? ''
    const heroImageUrl = formData.get('heroImageUrl') as string | null
    const heroImageFile = formData.get('heroImageFile') as File | null
    const galleryUrlsRaw = (formData.get('imageUrls') as string) ?? ''
    const isFeatured = formData.get('isFeatured') === 'true'
    const isTrending = formData.get('isTrending') === 'true'
    const isNewArrival = formData.get('isNewArrival') === 'true'
    const statsRaw = formData.get('stats') as string | null
    const productLinksRaw = formData.get('productLinks') as string | null

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    const handleUpload = async (file: File | null): Promise<string> => {
      if (!file || file.size === 0) return ''
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = file.name.split('.').pop() || 'png'
      const fileName = `${nanoid(10)}.${ext}`
      await mkdir(uploadDir, { recursive: true })
      await writeFile(join(uploadDir, fileName), buffer)
      return `/uploads/${fileName}`
    }

    let finalHeroImageUrl = heroImageUrl || ''
    if (heroImageFile && heroImageFile.size > 0) {
      finalHeroImageUrl = await handleUpload(heroImageFile)
    }

    // Additional gallery images can arrive as extra `galleryFile{n}` entries
    const galleryUrls: string[] = galleryUrlsRaw
      ? galleryUrlsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith('galleryFile') && value instanceof File && value.size > 0) {
        const uploaded = await handleUpload(value)
        if (uploaded) galleryUrls.push(uploaded)
      }
    }

    if (!finalHeroImageUrl) {
      return NextResponse.json({ error: 'heroImageUrl or heroImageFile required' }, { status: 400 })
    }

    const baseSlug = slugify(name)
    let slug = baseSlug
    let n = 1
    while (await prisma.player.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    let stats: unknown = null
    if (statsRaw) {
      try {
        stats = JSON.parse(statsRaw)
      } catch {
        stats = null
      }
    }

    let productLinks: { productId: string; label?: string }[] = []
    if (productLinksRaw) {
      try {
        const parsed = JSON.parse(productLinksRaw)
        if (Array.isArray(parsed)) productLinks = parsed
      } catch {
        productLinks = []
      }
    }

    const defaultTenant = await prisma.tenant.findFirst({ where: { isDefault: true } })
    if (!defaultTenant) {
      return NextResponse.json({ error: 'No default tenant configured' }, { status: 500 })
    }

    const player = await prisma.$transaction(async (tx) => {
      const created = await tx.player.create({
        data: {
          name,
          slug,
          jerseyNumber,
          position,
          bio,
          heroImageUrl: finalHeroImageUrl,
          imageUrls: galleryUrls.join(','),
          stats: stats ?? undefined,
          isFeatured,
          isTrending,
          isNewArrival,
          tenantId: defaultTenant.id,
        },
      })

      if (productLinks.length > 0) {
        await tx.playerProduct.createMany({
          data: productLinks.map((link, idx) => ({
            playerId: created.id,
            productId: link.productId,
            label: link.label ?? '',
            sortOrder: idx,
          })),
          skipDuplicates: true,
        })
      }

      return created
    })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      tenantId: player.tenantId,
      action: 'player.created',
      entityType: 'Player',
      entityId: player.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: { name, slug, jerseyNumber, position },
      req,
    })

    return NextResponse.json({ player }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
