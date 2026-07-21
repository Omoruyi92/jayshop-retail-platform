import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'

export const dynamic = 'force-dynamic'

// Unassign a brand from a top-level category.
export async function DELETE(req: Request, { params }: { params: { id: string; brandId: string } }) {
  const { error } = await requireRole(req, 'categories:write')
  if (error) return error

  const existing = await prisma.categoryBrand.findUnique({
    where: { categoryId_brandId: { categoryId: params.id, brandId: params.brandId } },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Brand assignment not found' }, { status: 404 })
  }

  await prisma.categoryBrand.delete({ where: { id: existing.id } })
  return NextResponse.json({ success: true })
}
