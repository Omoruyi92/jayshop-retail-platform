import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'
import { AdminRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }
type SessionUser = { adminId?: string | null; email?: string | null; role?: string }

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireRole(req, 'admin:manage')
  if (error) return error
  const user = session.user as SessionUser

  const { id } = params
  const body = await req.json().catch(() => ({}))
  const { role, password } = body

  if (role !== undefined && !['OWNER', 'MANAGER', 'STAFF', 'VIEWER'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  if (password !== undefined && (typeof password !== 'string' || password.length < 8)) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const admin = await prisma.admin.findUnique({ where: { id } })
  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  const data: { role?: AdminRole; passwordHash?: string; passwordUpdatedAt?: Date } = {}
  if (role !== undefined) {
    if (admin.id === user.adminId && role !== admin.role) {
      return NextResponse.json({ error: 'Cannot change own role' }, { status: 409 })
    }
    data.role = role as AdminRole
  }
  if (password !== undefined) {
    data.passwordHash = await bcrypt.hash(password, 10)
    data.passwordUpdatedAt = new Date()
  }

  const updated = await prisma.admin.update({ where: { id }, data })

  await prisma.auditLog.create({
    data: {
      tenantId: admin.tenantId,
      action: 'admin.updated',
      entityType: 'Admin',
      entityId: id,
      actorId: user.adminId,
      actorType: 'admin',
      actorEmail: user.email,
      before: { role: admin.role },
      after: { role: updated.role },
      payload: { changed: Object.keys(data).join(', ') },
    },
  })

  return NextResponse.json({ id: updated.id, email: updated.email, role: updated.role })
}

export async function DELETE(req: Request, { params }: Params) {
  const { session, error } = await requireRole(req, 'admin:manage')
  if (error) return error
  const user = session.user as SessionUser

  const { id } = params
  if (id === user.adminId) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 409 })
  }

  const admin = await prisma.admin.findUnique({ where: { id } })
  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  await prisma.admin.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      tenantId: admin.tenantId,
      action: 'admin.deleted',
      entityType: 'Admin',
      entityId: id,
      actorId: user.adminId,
      actorType: 'admin',
      actorEmail: user.email,
      payload: { email: admin.email, role: admin.role },
    },
  })

  return NextResponse.json({ deleted: true })
}
