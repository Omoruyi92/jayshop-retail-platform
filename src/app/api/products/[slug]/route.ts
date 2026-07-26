import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureProductTagColumns } from '@/lib/products/ensureProductTagColumns'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  await ensureProductTagColumns()
  const product = await prisma.product.findUnique({ where: { slug: params.slug } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product })
}
