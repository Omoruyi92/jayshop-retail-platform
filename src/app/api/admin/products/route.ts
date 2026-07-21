import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireRole } from '@/lib/auth/authorize'
import { getDefaultTenantId } from '@/lib/tenant'
import { getMainStoreLocationId } from '@/lib/store-locations'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'
import { brandToSlug } from '@/lib/constants'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function processImage(file: File | null, existingUrl: string) {
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

export async function POST(req: Request) {
  const { error } = await requireRole(req, 'products:write')
  if (error) return error

  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const priceCents = Number(formData.get('priceCents'))
    const salePriceCentsRaw = formData.get('salePriceCents')
    const salePriceCents = salePriceCentsRaw ? Number(salePriceCentsRaw) : 0
    const quantity = Number(formData.get('quantity') || '1')
    const sizes = (formData.get('sizes') as string) ?? ''
    const category = (formData.get('category') as string) ?? 'general'
    const subcategory = (formData.get('subcategory') as string) ?? ''
    const productType = (formData.get('productType') as string) ?? ''
    const audience = (formData.get('audience') as string) ?? ''
    const ageGroup = (formData.get('ageGroup') as string) ?? ''
    const hatStyle = (formData.get('hatStyle') as string) ?? ''
    const brand = (formData.get('brand') as string) ?? ''
    
    const imageUrl = formData.get('imageUrl') as string | null
    const imageFile = formData.get('imageFile') as File | null
    const imageUrl2 = formData.get('imageUrl2') as string | null
    const imageFile2 = formData.get('imageFile2') as File | null
    const imageUrl3 = formData.get('imageUrl3') as string | null
    const imageFile3 = formData.get('imageFile3') as File | null
    
    const colors = formData.get('colors') as string | null
    const isFeatured = formData.get('isFeatured') === 'true'
    const isSport = formData.get('isSport') === 'true'

    const sizeQuantitiesRaw = formData.get('sizeQuantities') as string | null
    const isLicensed = formData.get('isLicensed') === 'true'
    const isChampion = formData.get('isChampion') === 'true'
    const isNewArrival = formData.get('isNewArrival') === 'true'
    const isClearance = formData.get('isClearance') === 'true'
    const isBlankJersey = formData.get('isBlankJersey') === 'true'

    const sku = (formData.get('sku') as string | null) ?? null
    const material = (formData.get('material') as string | null) ?? ''
    const careInstructions = (formData.get('careInstructions') as string | null) ?? ''

    if (!name || !priceCents) {
      return NextResponse.json({ error: 'name and priceCents required' }, { status: 400 })
    }

    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      return NextResponse.json({ error: 'priceCents must be a positive integer' }, { status: 400 })
    }

    const finalImageUrl = await processImage(imageFile, imageUrl || '')
    const finalImageUrl2 = await processImage(imageFile2, imageUrl2 || '')
    const finalImageUrl3 = await processImage(imageFile3, imageUrl3 || '')

    if (!finalImageUrl) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 })
    }

    const baseSlug = slugify(name)
    let slug = baseSlug
    let n = 1
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    let sizeQuantitiesMap: Record<string, number> | null = null
    if (sizeQuantitiesRaw) {
      try {
        const parsed = JSON.parse(sizeQuantitiesRaw) as Record<string, number>
        if (typeof parsed === 'object' && parsed !== null) {
          sizeQuantitiesMap = parsed
        }
      } catch {
      }
    }

    const sizeList = sizes.split(',').map((s) => s.trim()).filter(Boolean)
    const tenantId = await getDefaultTenantId()
    const locationId = await getMainStoreLocationId()

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          tenantId,
          name,
          slug,
          description: description ?? null,
          priceCents,
          salePriceCents: Number.isFinite(salePriceCents) && salePriceCents > 0 ? salePriceCents : 0,
          quantity,
          sizes,
          category: category ?? 'general',
          subcategory: subcategory ?? '',
          productType: productType ?? '',
          audience: audience ?? '',
          ageGroup: ageGroup ?? '',
          hatStyle: hatStyle ?? '',
          brand: brand ?? '',
          imageUrl: finalImageUrl,
          imageUrl2: finalImageUrl2,
          imageUrl3: finalImageUrl3,
          colors: colors ? JSON.parse(colors) : [],
          isFeatured,
          isSport,
          isLicensed,
          isChampion,
          isNewArrival,
          isClearance,
          isBlankJersey,
          sku,
          material,
          careInstructions,
        },
      })

      if (sizeList.length > 0) {
        // Allocate total quantity evenly across the selected sizes at Main Store.
        // Remainder is deterministically added to the smallest sizes first so
        // the sum of SizeInventory rows exactly equals the product's total quantity.
        const baseQty = Math.floor(quantity / sizeList.length)
        const remainder = quantity - baseQty * sizeList.length
        await tx.sizeInventory.createMany({
          data: sizeList.map((size, index) => ({
            productId: created.id,
            size,
            locationId,
            quantity: (sizeQuantitiesMap?.[size] ?? baseQty) + (index < remainder ? 1 : 0),
          })),
        })
      } else {
        // Sizeless product: track total quantity via a single ONE_SIZE
        // SizeInventory row at Main Store, keeping it on the same
        // centralized inventory engine (holds/sales/transfers/replenishment)
        // as size-tracked products.
        await tx.sizeInventory.create({
          data: {
            productId: created.id,
            size: 'ONE_SIZE',
            locationId,
            quantity,
          },
        })
      }

      if (isNewArrival) {
        await tx.customerNotification.create({
          data: {
            type: 'NEW_ARRIVAL',
            title: 'New Arrival!',
            body: `${created.name} just landed — check it out.`,
            productId: created.id,
            productSlug: created.slug,
            imageUrl: created.imageUrl,
          },
        })
      }

      return created
    })

    revalidatePath('/brands')
    if (product.brand) revalidatePath(`/brands/${brandToSlug(product.brand)}`)

    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
