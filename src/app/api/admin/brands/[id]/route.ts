import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, type AdminSession } from '@/lib/auth/authorize'
import { recordAudit } from '@/lib/audit'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { nanoid } from 'nanoid'
import { brandToSlug } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireRole(req, 'brands:write')
    if (error) return error

    const brand = await prisma.brand.findUnique({ where: { id: params.id } })
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const contentType = req.headers.get('content-type') || ''
    const body = contentType.includes('application/json')
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries())

    const name = String(body.name ?? '').trim() || undefined
    const status = String(body.status ?? '').trim() || undefined
    const imageUrl = String(body.imageUrl ?? '').trim()
    const imageFile = body.imageFile instanceof File ? body.imageFile : null

    let finalImageUrl: string | undefined = imageUrl
    if (imageFile && imageFile.size > 0) {
      finalImageUrl = await uploadBrandLogo(imageFile)
    } else if (imageFile === null && imageUrl === '') {
      finalImageUrl = ''
    }

    let slug = brand.slug
    if (name && name.toLowerCase() !== brand.name.toLowerCase()) {
      const baseSlug = brandToSlug(name)
      let candidate = baseSlug
      let n = 1
      while (await prisma.brand.findUnique({ where: { slug: candidate } })) {
        if (candidate === brand.slug) break
        candidate = `${baseSlug}-${n++}`
      }
      slug = candidate
    }

    const data: {
      name?: string
      slug?: string
      status?: string
      imageUrl?: string
    } = { slug }
    if (name) data.name = name
    if (status) data.status = status
    if (finalImageUrl !== undefined) data.imageUrl = finalImageUrl

    const updated = await prisma.brand.update({
      where: { id: params.id },
      data,
    })

    // Sync brand name on linked products if name changed
    if (name && name !== brand.name) {
      await prisma.product.updateMany({
        where: { brand: brand.name },
        data: { brand: name },
      })
    }
    if (status && status !== brand.status && status === 'INACTIVE') {
      await prisma.product.updateMany({
        where: { brand: brand.name },
        data: { brand: '' },
      })
    }

    const admin = session!.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'brand.updated',
      entityType: 'Brand',
      entityId: params.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: { name: brand.name, slug: brand.slug, status: brand.status, imageUrl: brand.imageUrl },
      after: { name: updated.name, slug: updated.slug, status: updated.status, imageUrl: updated.imageUrl },
      req,
    })

    return NextResponse.json({ brand: updated })
  } catch (err) {
    console.error('PATCH /api/admin/brands/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireRole(req, 'brands:write')
    if (error) return error

    const brand = await prisma.brand.findUnique({ where: { id: params.id } })
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Unlink products instead of cascade
    await prisma.$transaction([
      prisma.product.updateMany({
        where: { brand: brand.name },
        data: { brand: '' },
      }),
      prisma.brand.delete({ where: { id: params.id } }),
    ])

    const admin = session!.user as AdminSession['user']
    await recordAudit({
      tx: prisma,
      action: 'brand.deleted',
      entityType: 'Brand',
      entityId: params.id,
      actorId: admin.adminId,
      actorType: 'admin',
      actorEmail: admin.email,
      before: { name: brand.name, slug: brand.slug },
      req,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/brands/[id]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function uploadBrandLogo(file: File): Promise<string> {
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'brands')
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `brand-${nanoid(10)}.${ext}`
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), buffer)
  return `/uploads/brands/${fileName}`
}
