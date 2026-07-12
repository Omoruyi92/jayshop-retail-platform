import { prisma } from '@/lib/prisma'
import { getProductAvailability, type ProductAvailability } from '@/lib/inventory/aggregate'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { productId: string } }
): Promise<Response> {
  const { productId } = params

  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }] },
    select: { id: true },
  })

  if (!product) {
    return Response.json({ error: 'Product not found' }, { status: 404 })
  }

  const availability: ProductAvailability = await getProductAvailability(product.id)

  return Response.json({ availability })
}
