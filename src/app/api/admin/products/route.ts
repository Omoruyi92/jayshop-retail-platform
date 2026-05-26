import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { requireAdminSession } from '@/lib/auth'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string | null
    const priceCents = Number(formData.get('priceCents'))
    const quantity = Number(formData.get('quantity') || '1')
    const sizes = (formData.get('sizes') as string) ?? ''
    const category = (formData.get('category') as string) ?? 'general'
    const subcategory = (formData.get('subcategory') as string) ?? ''
    const brand = (formData.get('brand') as string) ?? ''
    const imageUrl = formData.get('imageUrl') as string | null
    const imageFile = formData.get('imageFile') as File | null
    const sizeQuantitiesRaw = formData.get('sizeQuantities') as string | null
    const isLicensed = formData.get('isLicensed') === 'true'
    const isChampion = formData.get('isChampion') === 'true'

    if (!name || !priceCents) {
      return NextResponse.json({ error: 'name and priceCents required' }, { status: 400 })
    }

    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      return NextResponse.json({ error: 'priceCents must be a positive integer' }, { status: 400 })
    }

    let finalImageUrl = imageUrl || ''

    // Handle file upload
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = imageFile.name.split('.').pop() || 'png'
      const fileName = `${nanoid(10)}.${ext}`
      const uploadDir = join(process.cwd(), 'public', 'uploads')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(join(uploadDir, fileName), buffer)
      finalImageUrl = `/uploads/${fileName}`
    }

    if (!finalImageUrl) {
      return NextResponse.json({ error: 'imageUrl or imageFile required' }, { status: 400 })
    }

    const baseSlug = slugify(name)
    let slug = baseSlug
    let n = 1
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    // Parse per-size quantities if provided
    let sizeQuantitiesMap: Record<string, number> | null = null
    if (sizeQuantitiesRaw) {
      try {
        const parsed = JSON.parse(sizeQuantitiesRaw) as Record<string, number>
        if (typeof parsed === 'object' && parsed !== null) {
          sizeQuantitiesMap = parsed
        }
      } catch {
        // ignore malformed JSON; fall back to default distribution
      }
    }

    // Build SizeInventory rows if sizes are defined
    const sizeList = sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name,
          slug,
          description: description ?? null,
          priceCents,
          quantity,
          sizes,
          category: category ?? 'general',
          subcategory: subcategory ?? '',
          brand: brand ?? '',
          imageUrl: finalImageUrl,
          isLicensed,
          isChampion,
        },
      })

      if (sizeList.length > 0) {
        // Default per-size quantity: use provided map, or distribute evenly
        const defaultQty = Math.floor(quantity / sizeList.length)
        await tx.sizeInventory.createMany({
          data: sizeList.map((size) => ({
            productId: created.id,
            size,
            quantity: sizeQuantitiesMap?.[size] ?? defaultQty,
          })),
        })
      }

      return created
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
