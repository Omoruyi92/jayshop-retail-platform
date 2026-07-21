import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!domain) return email
  return `${user.slice(0, 2)}***@${domain}`
}

type SessionUser = { adminId?: string | null; email?: string | null; role?: string }

export async function GET(req: Request) {
  const { session, error } = await requireRole(req, 'admin:manage')
  if (error) return error

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, role: true, createdAt: true },
  })

  const user = session.user as SessionUser
  const isOwner = user.role === 'OWNER'
  const masked = !isOwner
    ? admins.map(a => ({ ...a, email: maskEmail(a.email) }))
    : admins

  return NextResponse.json({ rows: masked })
}

export async function POST(req: Request) {
  const { session, error } = await requireRole(req, 'admin:manage')
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const { email, password, role = 'STAFF' } = body

  if (!email || !password || !['OWNER', 'MANAGER', 'STAFF', 'VIEWER'].includes(role)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Admin already exists' }, { status: 409 })
  }

  const tenant = await prisma.tenant.findFirst({ where: { isDefault: true } })
  const tenantId = tenant?.id!

  const passwordHash = await bcrypt.hash(password, 10)
  const admin = await prisma.admin.create({
    data: {
      email,
      passwordHash,
      role,
      tenantId,
      passwordUpdatedAt: new Date(),
    },
  })

  const user = session.user as SessionUser
  await prisma.auditLog.create({
    data: {
      tenantId,
      action: 'admin.created',
      entityType: 'Admin',
      entityId: admin.id,
      actorId: user.adminId,
      actorType: 'admin',
      actorEmail: user.email,
      payload: { email, role },
    },
  })

  return NextResponse.json({ id: admin.id, email: admin.email, role: admin.role, createdAt: admin.createdAt })
}
