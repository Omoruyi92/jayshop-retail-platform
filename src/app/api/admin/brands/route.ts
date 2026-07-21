import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, type AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'
import { nanoid } from 'nanoid'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { brandToSlug } from '@/lib/constants'
import { optimizeImageBuffer } from '@/lib/media/optimizeImage'
import { getBrandProductCounts } from '@/lib/brands'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { error } = await requireRole(req, 'brands:read')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: { status?: string } = {}
    if (status && status !== 'ALL') {
      where.status = status
    }

    const brands = await prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    const counts = await getBrandProductCounts(brands.map((b) => b.name))

    return NextResponse.json({
      brands: brands.map((b, i) => ({ ...b, productCount: counts[i] })),
    })
  } catch (err) {
    console.error('GET /api/admin/brands', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { session, error } = await requireRole(req, 'brands:write')
    if (error) return error

    const formData = await req.formData()
    const name = String(formData.get('name') ?? '').trim()
    const status = String(formData.get('status') ?? 'ACTIVE').trim()
    const imageUrl = String(formData.get('imageUrl') ?? '').trim()
    const imageFile = formData.get('imageFile')

    if (!name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 })
    }

    const baseSlug = brandToSlug(name)
    let slug = baseSlug
    let n = 1
    while (await prisma.brand.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`
    }

    let finalImageUrl = imageUrl
    if (imageFile instanceof File && imageFile.size > 0) {
      finalImageUrl = await uploadBrandLogo(imageFile)
    }

    const brand = await prisma.brand.create({
      data: { name, slug, imageUrl: finalImageUrl, status },
    })

    const admin = session!.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'brand.created',
      entityType: 'Brand',
      entityId: brand.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      after: { name, slug, status, imageUrl: finalImageUrl },
      req,
    })

    revalidatePath('/brands')
    revalidatePath(`/brands/${slug}`)

    return NextResponse.json({ brand }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/brands', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function uploadBrandLogo(file: File): Promise<string> {
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'brands')
  const bytes = await file.arrayBuffer()
  const rawExt = file.name.split('.').pop() || 'png'
  const { buffer, ext } = await optimizeImageBuffer(Buffer.from(bytes), rawExt)
  const fileName = `brand-${nanoid(10)}.${ext}`
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/brands/${fileName}`
}
