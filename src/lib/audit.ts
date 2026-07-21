import { Prisma, PrismaClient } from '@prisma/client'
import { headers } from 'next/headers'

export type AuditAction =
  | 'hold.created'
  | 'hold.resolved'
  | 'hold.expired'
  | 'hold.cancelled'
  | 'inventory.created'
  | 'inventory.updated'
  | 'inventory.deleted'
  | 'inventory.transfer'
  | 'inventory.restock'
  | 'inventory.adjustment'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'pos-key.created'
  | 'pos-key.revoked'
  | 'pos-key.reactivated'
  | 'pos-sale.applied'
  | 'pos-return.applied'
  | 'pos-event.rejected'
  | 'hold-settings.updated'
  | 'game-day.created'
  | 'game-day.deleted'
  | 'admin.created'
  | 'admin.updated'
  | 'admin.deleted'
  | 'slack-settings.updated'
  | 'report.exported'
  | 'audit.exported'
  | 'player.created'
  | 'player.updated'
  | 'player.archived'
  | 'brand.created'
  | 'brand.updated'
  | 'brand.deleted'
  | 'feedback.deleted'
  | 'promotion.created'
  | 'promotion.updated'
  | 'promotion.archived'
  | 'promotion.deleted'
  | 'feedback.approved'
  | 'feedback.rejected'
  | 'review.approved'
  | 'review.rejected'
  | 'review.deleted'
  | 'gallery.created'
  | 'gallery.updated'
  | 'gallery.archived'
  | 'style-category.created'
  | 'style-category.updated'
  | 'style-category.deleted'
  | 'style-category.product-assigned'
  | 'style-category.product-unassigned'

type AuditInput = {
  tx: Prisma.TransactionClient | PrismaClient
  tenantId?: string | null
  action: AuditAction
  entityType: string
  entityId: string
  actorId?: string | null
  actorType?: 'admin' | 'customer' | 'system' | string | null
  actorEmail?: string | null
  before?: object | null
  after?: object | null
  payload?: object | null
  note?: string | null
  req?: Request | null
}

export async function recordAudit(input: AuditInput) {
  const { tx } = input
  try {
    let ip: string | null = null
    let userAgent: string | null = null
    if (input.req) {
      try {
        const h = await headers()
        ip = h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? null
        userAgent = h.get('user-agent') ?? null
      } catch {
        // headers() may throw outside request scope; ignore
      }
    }

    await tx.auditLog.create({
      data: {
        tenantId: input.tenantId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        actorType: input.actorType ?? null,
        actorEmail: input.actorEmail ?? null,
        before: input.before as Prisma.InputJsonValue | undefined,
        after: input.after as Prisma.InputJsonValue | undefined,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        ip,
        userAgent,
        note: input.note ?? null,
      },
    })
  } catch (err) {
    console.error('[recordAudit] failed to write audit log:', err)
  }
}
