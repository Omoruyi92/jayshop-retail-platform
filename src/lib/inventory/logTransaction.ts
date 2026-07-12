import type { Prisma, PrismaClient } from '@prisma/client'
import { broadcaster } from '@/lib/realtime/broadcaster'

export type InventoryTransactionType =
  | 'transfer'
  | 'adjustment'
  | 'sale'
  | 'return'
  | 'hold-reserve'
  | 'hold-release'
  | 'assign'
  | 'remove'

export type LogInventoryTransactionInput = {
  productId: string
  size?: string | null
  type: InventoryTransactionType
  quantity: number
  fromLocationId?: string | null
  toLocationId?: string | null
  actorId?: string | null
  actorEmail?: string | null
  note?: string | null
}

/**
 * Append-only insert into InventoryTransaction. Must be called inside the
 * same `$transaction` as the inventory mutation it describes, so the audit
 * trail and the actual state change are atomic.
 */
export async function logInventoryTransaction(
  tx: Prisma.TransactionClient | PrismaClient,
  input: LogInventoryTransactionInput
) {
  const result = await tx.inventoryTransaction.create({
    data: {
      productId: input.productId,
      size: input.size ?? null,
      type: input.type,
      quantity: input.quantity,
      fromLocationId: input.fromLocationId ?? null,
      toLocationId: input.toLocationId ?? null,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      note: input.note ?? null,
    },
  })

  // Belt-and-suspenders: the PG trigger on SizeInventory (see migration
  // 20260704000000_inventory_realtime_notify) is the primary real-time
  // signal. This local emit covers the window between a DB restart and the
  // pgListener reconnecting — deduped in broadcaster.publish() so a normal
  // running system never double-delivers to SSE subscribers.
  // Awaited (not fire-and-forget) since `tx` may be an interactive
  // transaction client that closes once this function returns.
  const locationId = input.toLocationId ?? input.fromLocationId
  if (locationId) {
    try {
      const row = await tx.sizeInventory.findUnique({
        where: { productId_size_locationId: { productId: input.productId, size: input.size ?? '', locationId } },
        select: { quantity: true, heldQuantity: true, pickedQuantity: true },
      })
      if (row) {
        const newQty = row.quantity - row.heldQuantity - row.pickedQuantity
        broadcaster.publish('inventory_changed', {
          productId: input.productId,
          size: input.size ?? null,
          locationId,
          oldQty: newQty - input.quantity,
          newQty,
          op: 'UPDATE',
          ts: Date.now(),
        })
      }
    } catch {
      // Fallback path only — safe to ignore, PG trigger is the primary signal.
    }
  }

  return result
}

/**
 * Resolves actorId/actorEmail from a NextAuth session, verifying the admin
 * still exists in the DB (mirrors the defensive check in resolveHold).
 */
export async function resolveActorFromSession(
  tx: Prisma.TransactionClient | PrismaClient,
  session: unknown
): Promise<{ actorId: string | null; actorEmail: string | null }> {
  const s = session as { user?: { adminId?: string; email?: string | null } } | null | undefined
  const adminId = s?.user?.adminId ?? null
  if (!adminId) return { actorId: null, actorEmail: s?.user?.email ?? null }
  const admin = await tx.admin.findUnique({ where: { id: adminId }, select: { id: true, email: true } })
  if (!admin) return { actorId: null, actorEmail: s?.user?.email ?? null }
  return { actorId: admin.id, actorEmail: admin.email }
}
