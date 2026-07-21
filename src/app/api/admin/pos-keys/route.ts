import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireRole, AdminSession } from '@/lib/auth/authorize.server'
import { recordAudit } from '@/lib/audit'
import { generateRawPosKey, POS_BCRYPT_COST } from '@/lib/pos/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/pos-keys
 * Lists all POS API keys (masked — raw key is never persisted or returned).
 */
export async function GET(req: Request) {
  const { error } = await requireRole(req, 'pos-keys:manage')
  if (error) return error

  const keys = await prisma.posApiKey.findMany({
    orderBy: { createdAt: 'desc' },
    include: { location: { select: { id: true, code: true, name: true } } },
  })

  return NextResponse.json({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      locationId: k.locationId,
      location: k.location,
      active: k.active,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      createdBy: k.createdBy,
    })),
  })
}

/**
 * POST /api/admin/pos-keys
 * Body: { name: string, locationId?: string | null }
 * Generates a new raw key, returns it ONCE, and persists only its bcrypt hash.
 */
export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'pos-keys:manage')
  if (error) return error

  const body = await req.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  const name = body.name.trim()
  const locationId = typeof body.locationId === 'string' && body.locationId ? body.locationId : null

  if (locationId) {
    const loc = await prisma.storeLocation.findUnique({ where: { id: locationId }, select: { id: true } })
    if (!loc) {
      return NextResponse.json({ error: 'Invalid locationId' }, { status: 400 })
    }
  }

  const rawKey = generateRawPosKey()
  const keyHash = await bcrypt.hash(rawKey, POS_BCRYPT_COST)

  const createdBy = (session as { user?: { email?: string | null } } | null)?.user?.email ?? null

  const created = await prisma.posApiKey.create({
    data: { name, keyHash, locationId, createdBy },
    include: { location: { select: { id: true, code: true, name: true } } },
  })

  const admin = session.user as AdminSession['user']
  await recordAudit({
    tx: prisma,
    action: 'pos-key.created',
    entityType: 'PosApiKey',
    entityId: created.id,
    actorId: admin.adminId,
    actorType: 'admin',
    actorEmail: admin.email,
    after: { name, locationId, active: true },
    req,
  })

  // rawKey is returned exactly once here; never logged, never persisted raw.
  return NextResponse.json({
    key: {
      id: created.id,
      name: created.name,
      locationId: created.locationId,
      location: created.location,
      active: created.active,
      createdAt: created.createdAt,
    },
    rawKey,
  }, { status: 201 })
}
