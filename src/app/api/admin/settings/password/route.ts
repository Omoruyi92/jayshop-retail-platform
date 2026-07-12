import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize'

export const dynamic = 'force-dynamic'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export async function PATCH(req: Request) {
  const { session, error } = await requireRole(req, 'admin:manage')
  if (error) return error

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 })
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return NextResponse.json(
      {
        error:
          'New password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)',
      },
      { status: 422 },
    )
  }

  try {
    const adminId = (session as any)?.user?.adminId
    const admin = await prisma.admin.findUnique({ where: { id: adminId } })
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    const passwordValid = await bcrypt.compare(currentPassword, admin.passwordHash)
    if (!passwordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[settings/password] PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
