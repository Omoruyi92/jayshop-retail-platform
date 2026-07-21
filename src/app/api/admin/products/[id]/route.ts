import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireRole } from '@/lib/auth/authorize'
import {
  isLocalUpload,
  getImageReferences,
  safeUnlinkUpload,
} from '@/lib/media/cleanup'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'
import { brandToSlug } from '@/lib/constants'
import { revalidatePath } from 'next/cache'
import { parseFormData, parseJsonBody, apiErrorResponse, badRequest, parseJsonField } from '@/lib/api/request'

export const dynamic = 'force-dynamic'

async function processImage(file: File | null, existingUrl: string | null) {
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer()
    const rawExt = file.name.split('.').pop() || 'png'
    const { buffer, ext } = await optimizeImageBuffer(Buffer.from(bytes), rawExt)
    const fileName = `${nanoid(10)}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, fileName), buffer)
    return `/uploads/${fileName}`
  }
  return existingUrl
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'products:write')
  if (error) return error

  try {
    let body: any = {}
    let isFormData = false

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { imageUrl: true, imageUrl2: true, imageUrl3: true, isNewArrival: true, brand: true },
    })

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      isFormData = true
      const formData = await parseFormData(req)
      
      const imageUrl = formData.get('imageUrl') as string | null
      const imageFile = formData.get('imageFile') as File | null
      const imageUrl2 = formData.get('imageUrl2') as string | null
      const imageFile2 = formData.get('imageFile2') as File | null
      const imageUrl3 = formData.get('imageUrl3') as string | null
      const imageFile3 = formData.get('imageFile3') as File | null

      // IMPORTANT: an explicitly empty string means "this image slot was
      // deleted by the admin" and must be persisted as empty — it must NOT
      // silently fall back to the previous stored image. Only fall back to
      // the existing value when the client didn't send the field at all
      // (e.g. a JSON PATCH that only updates unrelated fields).
      const resolveImageSlot = async (file: File | null, urlField: string | null, existingUrl: string | undefined, hasField: boolean) => {
        if (file && file.size > 0) return processImage(file, urlField)
        if (hasField) return urlField ?? ''
        return existingUrl ?? ''
      }

      body.imageUrl = await resolveImageSlot(imageFile, imageUrl, existing?.imageUrl, formData.has('imageUrl'))
      body.imageUrl2 = await resolveImageSlot(imageFile2, imageUrl2, existing?.imageUrl2, formData.has('imageUrl2'))
      body.imageUrl3 = await resolveImageSlot(imageFile3, imageUrl3, existing?.imageUrl3, formData.has('imageUrl3'))

      if (!body.imageUrl) {
        return badRequest('At least one image is required')
      }
      
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
      if (formData.has('sku')) body.sku = formData.get('sku')
      if (formData.has('material')) body.material = formData.get('material')
      if (formData.has('careInstructions')) body.careInstructions = formData.get('careInstructions')
      
      if (formData.has('isLicensed')) body.isLicensed = formData.get('isLicensed') === 'true'
      if (formData.has('isChampion')) body.isChampion = formData.get('isChampion') === 'true'
      if (formData.has('isNewArrival')) body.isNewArrival = formData.get('isNewArrival') === 'true'
      if (formData.has('isClearance')) body.isClearance = formData.get('isClearance') === 'true'
      if (formData.has('isFeatured')) body.isFeatured = formData.get('isFeatured') === 'true'
      if (formData.has('isSport')) body.isSport = formData.get('isSport') === 'true'
      if (formData.has('isBlankJersey')) body.isBlankJersey = formData.get('isBlankJersey') === 'true'
      
      if (formData.has('colors')) body.colors = parseJsonField(formData.get('colors') as string, 'colors')
      // sizeInventories is intentionally ignored — Main Store size allocation is
      // read-only in the Edit modal and can only be changed via the Location
      // Inventory modal (which uses /api/admin/products/[id]/inventory).
    } else {
      body = await parseJsonBody(req)
    }

    const oldImageUrl = existing?.imageUrl ?? null
    const oldImageUrl2 = existing?.imageUrl2 ?? null
    const oldImageUrl3 = existing?.imageUrl3 ?? null
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
        ...(body.sku          !== undefined && { sku: body.sku }),
        ...(body.material     !== undefined && { material: body.material }),
        ...(body.careInstructions !== undefined && { careInstructions: body.careInstructions }),
        ...(body.colors       !== undefined && { colors: body.colors }),
        ...(body.isLicensed   !== undefined && { isLicensed: Boolean(body.isLicensed) }),
        ...(body.isChampion   !== undefined && { isChampion: Boolean(body.isChampion) }),
        ...(body.isNewArrival !== undefined && { isNewArrival: Boolean(body.isNewArrival) }),
        ...(body.isClearance  !== undefined && { isClearance: Boolean(body.isClearance) }),
        ...(body.isFeatured   !== undefined && { isFeatured: Boolean(body.isFeatured) }),
        ...(body.isSport      !== undefined && { isSport: Boolean(body.isSport) }),
        ...(body.isBlankJersey !== undefined && { isBlankJersey: Boolean(body.isBlankJersey) }),
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

    // Archiving a product hides it from all customer-facing sections (shop,
    // PDP, search) just like a hard delete — so its notifications must be
    // cleared too, otherwise a stale "New Arrival" entry can still link to a
    // now-unreachable product page.
    if (body.status === 'ARCHIVED') {
      await prisma.customerNotification.deleteMany({ where: { productId: product.id } })
    }

    // Clean up replaced/removed local upload files for all 3 image slots
    // (only if the value actually changed) — deleting or replacing one
    // image slot must not leave orphaned files on disk, and must not touch
    // files still referenced by the other two slots.
    const cleanupIfChanged = async (oldUrl: string | null, newUrl: string | undefined) => {
      if (oldUrl && newUrl !== undefined && newUrl !== oldUrl && isLocalUpload(oldUrl)) {
        const refs = await getImageReferences(prisma, oldUrl.replace(/^\/uploads\//, ''))
        if (refs === 0) await safeUnlinkUpload(oldUrl)
      }
    }
    await cleanupIfChanged(oldImageUrl, body.imageUrl)
    await cleanupIfChanged(oldImageUrl2, body.imageUrl2)
    await cleanupIfChanged(oldImageUrl3, body.imageUrl3)

    revalidatePath('/brands')
    if (existing?.brand) revalidatePath(`/brands/${brandToSlug(existing.brand)}`)
    if (body.brand && body.brand !== existing?.brand) revalidatePath(`/brands/${brandToSlug(body.brand)}`)

    return NextResponse.json({
      ...product,
      remaining: product.quantity - product.heldQuantity - product.pickedQuantity,
    })
  } catch (err) {
    return apiErrorResponse(err, 'Failed to update product')
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(req, 'products:delete')
  if (error) return error

  try {
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      select: { imageUrl: true, brand: true },
    })

    await prisma.product.delete({ where: { id: params.id } })

    // Deleted products must not linger in customer-facing notification feeds
    // (New Arrivals bell, etc.) — remove any notifications referencing this
    // product. Receipts cascade-delete automatically via the schema.
    await prisma.customerNotification.deleteMany({ where: { productId: params.id } })

    revalidatePath('/brands')
    if (existing?.brand) revalidatePath(`/brands/${brandToSlug(existing.brand)}`)

    if (existing?.imageUrl && isLocalUpload(existing.imageUrl)) {
      const refs = await getImageReferences(prisma, existing.imageUrl.replace(/^\/uploads\//, ''))
      if (refs === 0) await safeUnlinkUpload(existing.imageUrl)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiErrorResponse(err, 'Failed to delete product')
  }
}
