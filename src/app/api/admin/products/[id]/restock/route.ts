import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize'
import { restock } from '@/lib/inventory/mutations'
import { parseJsonBody, apiErrorResponse, badRequest } from '@/lib/api/request'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/products/[id]/restock
 * Manually replenish stock for a product and/or specific size.
 * - size present  → increments SizeInventory.quantity
 * - size absent   → increments legacy Product.quantity
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { session, error: authError } = await requireRole(req, 'inventory:write')
  if (authError || !session) {
    return authError ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { addQuantity?: unknown; size?: unknown; note?: unknown }
  try {
    body = await parseJsonBody(req)
  } catch (err) {
    return apiErrorResponse(err)
  }
  const addQty = Number(body.addQuantity)
  const size = typeof body.size === 'string' && body.size.trim() ? body.size.trim() : undefined

  if (!Number.isFinite(addQty) || addQty <= 0) {
    return badRequest('addQuantity must be a positive number')
  }

  try {
    const user = session.user
    const updated = await restock({
      productId: params.id,
      addQty,
      size,
      actorId: user.adminId,
      actorEmail: user.email,
      note: body.note as string | undefined,
    })

    return NextResponse.json({ success: true, ...updated })
  } catch (err) {
    const e = err as Error & { code?: string }
    if (e.code === 'PRODUCT_NOT_FOUND') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    if (e.code === 'SIZE_NOT_FOUND') {
      return NextResponse.json({ error: 'Size variant not found for this product' }, { status: 404 })
    }
    return apiErrorResponse(err, 'Failed to restock')
  }
}
