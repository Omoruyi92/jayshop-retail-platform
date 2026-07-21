import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireRole, AdminSession } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'

export const dynamic = 'force-dynamic'

async function uploadFile(file: File): Promise<string> {
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const { buffer, ext } = await optimizeImageBuffer(Buffer.from(bytes), rawExt)
  const fileName = `${nanoid(10)}.${ext}`
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/${fileName}`
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'players:write')
  if (error) return error

  try {
    const existing = await prisma.player.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const contentType = req.headers.get('content-type') || ''
    let body: Record<string, unknown> = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      body = {}
      for (const key of ['name', 'jerseyNumber', 'position', 'bio', 'heroImageUrl', 'imageUrls', 'status', 'sortOrder']) {
        const v = formData.get(key)
        if (v !== null) body[key] = v as string
      }
      for (const key of ['isFeatured', 'isTrending', 'isNewArrival']) {
        const v = formData.get(key)
        if (v !== null) body[key] = v === 'true'
      }
      const statsRaw = formData.get('stats') as string | null
      if (statsRaw !== null) {
        try { body.stats = statsRaw ? JSON.parse(statsRaw) : null } catch { body.stats = null }
      }
      const productLinksRaw = formData.get('productLinks') as string | null
      if (productLinksRaw !== null) {
        try { body.productLinks = JSON.parse(productLinksRaw) } catch { body.productLinks = [] }
      }

      const heroImageFile = formData.get('heroImageFile') as File | null
      if (heroImageFile && heroImageFile.size > 0) {
        body.heroImageUrl = await uploadFile(heroImageFile)
      }

      const galleryUrls: string[] = typeof body.imageUrls === 'string' && body.imageUrls
        ? (body.imageUrls as string).split(',').map((s) => s.trim()).filter(Boolean)
        : []
      for (const [key, value] of Array.from(formData.entries())) {
        if (key.startsWith('galleryFile') && value instanceof File && value.size > 0) {
          const uploaded = await uploadFile(value)
          if (uploaded) galleryUrls.push(uploaded)
        }
      }
      if (galleryUrls.length > 0) body.imageUrls = galleryUrls.join(',')
    } else {
      body = await req.json()
    }

    let stats: unknown | undefined = undefined
    if (body.stats !== undefined) {
      stats = body.stats === null ? null : body.stats
    }

    const player = await prisma.player.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name as string }),
        ...(body.jerseyNumber !== undefined && { jerseyNumber: body.jerseyNumber as string }),
        ...(body.position !== undefined && { position: body.position as string }),
        ...(body.bio !== undefined && { bio: body.bio as string }),
        ...(body.heroImageUrl !== undefined && { heroImageUrl: body.heroImageUrl as string }),
        ...(body.imageUrls !== undefined && { imageUrls: body.imageUrls as string }),
        ...(stats !== undefined && { stats: stats as never }),
        ...(body.isFeatured !== undefined && { isFeatured: Boolean(body.isFeatured) }),
        ...(body.isTrending !== undefined && { isTrending: Boolean(body.isTrending) }),
        ...(body.isNewArrival !== undefined && { isNewArrival: Boolean(body.isNewArrival) }),
        ...(body.status !== undefined && { status: body.status as string }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
    })

    // Re-sync SKU-based product mappings when provided.
    // Expected shape: productLinks: { productId: string; label?: string }[]
    if (Array.isArray(body.productLinks)) {
      const links = body.productLinks as { productId: string; label?: string }[]
      await prisma.$transaction(async (tx) => {
        await tx.playerProduct.deleteMany({ where: { playerId: params.id } })
        if (links.length > 0) {
          await tx.playerProduct.createMany({
            data: links.map((link, idx) => ({
              playerId: params.id,
              productId: link.productId,
              label: link.label ?? '',
              sortOrder: idx,
            })),
            skipDuplicates: true,
          })
        }
      })
    }

    const refreshed = await prisma.player.findUnique({
      where: { id: params.id },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
          include: { product: { select: { id: true, name: true, slug: true, imageUrl: true, priceCents: true } } },
        },
      },
    })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      tenantId: player.tenantId,
      action: 'player.updated',
      entityType: 'Player',
      entityId: player.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: body,
      req,
    })

    return NextResponse.json({ player: refreshed })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireRole(req, 'players:write')
  if (error) return error

  try {
    const existing = await prisma.player.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Soft-archive rather than hard-delete, consistent with Product archiving.
    const player = await prisma.player.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    })

    const admin = session.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      tenantId: player.tenantId,
      action: 'player.archived',
      entityType: 'Player',
      entityId: player.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: { status: 'ARCHIVED' },
      req,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to archive player' }, { status: 500 })
  }
}
