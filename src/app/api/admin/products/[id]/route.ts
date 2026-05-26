import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth'
import {
  isLocalUpload,
  getImageReferences,
  safeUnlinkUpload,
} from '@/lib/media/cleanup'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    const body = await req.json()

    // Capture old imageUrl before update so we can clean up if it changes
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { imageUrl: true },
    })
    const oldImageUrl = existing?.imageUrl ?? null

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(body.name        !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.priceCents  !== undefined && { priceCents: Number(body.priceCents) }),
        ...(body.imageUrl    !== undefined && { imageUrl: body.imageUrl }),
        ...(body.status      !== undefined && { status: body.status }),
        ...(body.category    !== undefined && { category: body.category }),
        ...(body.quantity    !== undefined && { quantity: Number(body.quantity) }),
        ...(body.brand       !== undefined && { brand: body.brand }),
        ...(body.sizes       !== undefined && { sizes: body.sizes }),
        ...(body.isLicensed  !== undefined && { isLicensed: Boolean(body.isLicensed) }),
        ...(body.isChampion  !== undefined && { isChampion: Boolean(body.isChampion) }),
      },
      include: { _count: { select: { holds: true } } },
    })

    // Clean up replaced local upload file (only if imageUrl actually changed)
    if (
      oldImageUrl &&
      body.imageUrl !== undefined &&
      body.imageUrl !== oldImageUrl &&
      isLocalUpload(oldImageUrl)
    ) {
      const refs = await getImageReferences(prisma, oldImageUrl.replace(/^\/uploads\//, ''))
      if (refs === 0) {
        await safeUnlinkUpload(oldImageUrl)
      }
    }

    // Handle per-size inventory upserts when provided
    // Expected shape: sizeInventories: { size: string; quantity: number }[]
    if (Array.isArray(body.sizeInventories)) {
      const entries = body.sizeInventories as { size: string; quantity: number }[]
      await Promise.all(
        entries.map((entry) =>
          prisma.sizeInventory.upsert({
            where: { productId_size: { productId: params.id, size: entry.size } },
            update: { quantity: Number(entry.quantity) },
            create: {
              productId: params.id,
              size: entry.size,
              quantity: Number(entry.quantity),
            },
          })
        )
      )

      // Remove SizeInventory rows for sizes no longer in the product's sizes string
      if (body.sizes !== undefined) {
        const activeSizes = String(body.sizes)
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
        const submittedSizes = entries.map((e) => e.size)
        const sizesToRemove = submittedSizes.filter((s) => !activeSizes.includes(s))
        if (sizesToRemove.length > 0) {
          await prisma.sizeInventory.deleteMany({
            where: { productId: params.id, size: { in: sizesToRemove } },
          })
        }
      }
    }

    return NextResponse.json({
      ...product,
      remaining: product.quantity - product.heldQuantity,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    // Capture imageUrl before deleting so we can clean up the file afterward
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { imageUrl: true },
    })

    await prisma.product.delete({ where: { id: params.id } })

    // After successful DB delete, remove the local upload file if no other
    // product or HoldHistory record still references it
    if (existing?.imageUrl && isLocalUpload(existing.imageUrl)) {
      const refs = await getImageReferences(
        prisma,
        existing.imageUrl.replace(/^\/uploads\//, '')
      )
      if (refs === 0) {
        await safeUnlinkUpload(existing.imageUrl)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
