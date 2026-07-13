import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireAdminSession } from '@/lib/auth'
import {
  isLocalUpload,
  getImageReferences,
  safeUnlinkUpload,
} from '@/lib/media/cleanup'
import { getMainStoreLocationId } from '@/lib/store-locations'

export const dynamic = 'force-dynamic'

async function processImage(file: File | null, existingUrl: string | null) {
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${nanoid(10)}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, fileName), buffer)
    return `/uploads/${fileName}`
  }
  return existingUrl
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    let body: any = {}
    let isFormData = false

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      isFormData = true
      const formData = await req.formData()
      
      const existing = await prisma.product.findUnique({
        where: { id: params.id },
        select: { imageUrl: true, imageUrl2: true, imageUrl3: true },
      })
      
      const imageUrl = formData.get('imageUrl') as string | null
      const imageFile = formData.get('imageFile') as File | null
      const imageUrl2 = formData.get('imageUrl2') as string | null
      const imageFile2 = formData.get('imageFile2') as File | null
      const imageUrl3 = formData.get('imageUrl3') as string | null
      const imageFile3 = formData.get('imageFile3') as File | null

      body.imageUrl = await processImage(imageFile, imageUrl) || existing?.imageUrl
      body.imageUrl2 = await processImage(imageFile2, imageUrl2) || existing?.imageUrl2 || ''
      body.imageUrl3 = await processImage(imageFile3, imageUrl3) || existing?.imageUrl3 || ''
      
      if (formData.has('name')) body.name = formData.get('name')
      if (formData.has('description')) body.description = formData.get('description')
      if (formData.has('priceCents')) body.priceCents = Number(formData.get('priceCents'))
      if (formData.has('salePriceCents')) body.salePriceCents = Number(formData.get('salePriceCents'))
      if (formData.has('status')) body.status = formData.get('status')
      if (formData.has('category')) body.category = formData.get('category')
      if (formData.has('subcategory')) body.subcategory = formData.get('subcategory')
      if (formData.has('hatStyle')) body.hatStyle = formData.get('hatStyle')
      if (formData.has('quantity')) body.quantity = Number(formData.get('quantity'))
      if (formData.has('brand')) body.brand = formData.get('brand')
      if (formData.has('sizes')) body.sizes = formData.get('sizes')
      
      if (formData.has('isLicensed')) body.isLicensed = formData.get('isLicensed') === 'true'
      if (formData.has('isChampion')) body.isChampion = formData.get('isChampion') === 'true'
      if (formData.has('isNewArrival')) body.isNewArrival = formData.get('isNewArrival') === 'true'
      if (formData.has('isClearance')) body.isClearance = formData.get('isClearance') === 'true'
      if (formData.has('isFeatured')) body.isFeatured = formData.get('isFeatured') === 'true'
      if (formData.has('isSport')) body.isSport = formData.get('isSport') === 'true'
      if (formData.has('isAuthenticated')) body.isAuthenticated = formData.get('isAuthenticated') === 'true'
      
      if (formData.has('colors')) body.colors = JSON.parse(formData.get('colors') as string)
      if (formData.has('sizeInventories')) body.sizeInventories = JSON.parse(formData.get('sizeInventories') as string)
    } else {
      body = await req.json()
    }

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { imageUrl: true, imageUrl2: true, imageUrl3: true, isNewArrival: true },
    })
    const oldImageUrl = existing?.imageUrl ?? null
    const wasNewArrival = existing?.isNewArrival ?? false

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(body.name         !== undefined && { name: body.name }),
        ...(body.description  !== undefined && { description: body.description }),
        ...(body.priceCents   !== undefined && { priceCents: Number(body.priceCents) }),
        ...(body.salePriceCents !== undefined && { salePriceCents: Number(body.salePriceCents) }),
        ...(body.imageUrl     !== undefined && { imageUrl: body.imageUrl }),
        ...(body.imageUrl2    !== undefined && { imageUrl2: body.imageUrl2 }),
        ...(body.imageUrl3    !== undefined && { imageUrl3: body.imageUrl3 }),
        ...(body.status       !== undefined && { status: body.status }),
        ...(body.category     !== undefined && { category: body.category }),
        ...(body.subcategory  !== undefined && { subcategory: body.subcategory }),
        ...(body.hatStyle     !== undefined && { hatStyle: body.hatStyle }),
        ...(body.quantity     !== undefined && { quantity: Number(body.quantity) }),
        ...(body.brand        !== undefined && { brand: body.brand }),
        ...(body.sizes        !== undefined && { sizes: body.sizes }),
        ...(body.colors       !== undefined && { colors: body.colors }),
        ...(body.isLicensed   !== undefined && { isLicensed: Boolean(body.isLicensed) }),
        ...(body.isChampion   !== undefined && { isChampion: Boolean(body.isChampion) }),
        ...(body.isNewArrival !== undefined && { isNewArrival: Boolean(body.isNewArrival) }),
        ...(body.isClearance  !== undefined && { isClearance: Boolean(body.isClearance) }),
        ...(body.isFeatured   !== undefined && { isFeatured: Boolean(body.isFeatured) }),
        ...(body.isSport      !== undefined && { isSport: Boolean(body.isSport) }),
        ...(body.isAuthenticated !== undefined && { isAuthenticated: Boolean(body.isAuthenticated) }),
      },
      include: { _count: { select: { holds: true } } },
    })

    if (body.isNewArrival !== undefined && Boolean(body.isNewArrival) && !wasNewArrival) {
      await prisma.customerNotification.create({
        data: {
          type: 'NEW_ARRIVAL',
          title: 'New Arrival!',
          body: `${product.name} just landed — check it out.`,
          productId: product.id,
          productSlug: product.slug,
          imageUrl: product.imageUrl,
        },
      })
    }

    // Clean up replaced local upload file (only if imageUrl actually changed)
    if (oldImageUrl && body.imageUrl !== undefined && body.imageUrl !== oldImageUrl && isLocalUpload(oldImageUrl)) {
      const refs = await getImageReferences(prisma, oldImageUrl.replace(/^\/uploads\//, ''))
      if (refs === 0) await safeUnlinkUpload(oldImageUrl)
    }

    if (Array.isArray(body.sizeInventories)) {
      const entries = body.sizeInventories as { size: string; quantity: number }[]
      const locationId = await getMainStoreLocationId()
      await Promise.all(
        entries.map((entry) =>
          prisma.sizeInventory.upsert({
            where: { productId_size_locationId: { productId: params.id, size: entry.size, locationId } },
            update: { quantity: Number(entry.quantity) },
            create: {
              productId: params.id,
              size: entry.size,
              locationId,
              quantity: Number(entry.quantity),
            },
          })
        )
      )

      if (body.sizes !== undefined) {
        const activeSizes = String(body.sizes).split(',').map((s: string) => s.trim()).filter(Boolean)
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
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { imageUrl: true },
    })

    await prisma.product.delete({ where: { id: params.id } })

    if (existing?.imageUrl && isLocalUpload(existing.imageUrl)) {
      const refs = await getImageReferences(prisma, existing.imageUrl.replace(/^\/uploads\//, ''))
      if (refs === 0) await safeUnlinkUpload(existing.imageUrl)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
