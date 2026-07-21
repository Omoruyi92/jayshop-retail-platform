import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { can, type AdminSession } from './authorize'

// Server-only module: session/auth checks that depend on next-auth. Keep
// next-auth and next/server imports isolated here so client bundles that
// only need the pure logic/types/constants (see ./authorize) stay lean.

export type { AdminSession } from './authorize'

export type AuthCheckResult =
  | { session: AdminSession; error: null }
  | { session: null; error: NextResponse }

/**
 * Ensures the session includes an admin role and that the role meets or
 * exceeds the minimum required role for an action.
 */
export async function requireRole(
  req: Request,
  action: string
): Promise<AuthCheckResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.adminId) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  let role = (session.user as any).role

  // Fallback to database if role is missing in session cookie
  if (!role && session.user.adminId) {
    const { prisma } = await import('@/lib/prisma')
    const dbAdmin = await prisma.admin.findUnique({ where: { id: session.user.adminId } })
    if (dbAdmin) role = dbAdmin.role
  }

  if (!role || !can(role, action)) {
    return {
      session: null,
      error: NextResponse.json({ error: `Forbidden: required action ${action}` }, { status: 403 }),
    }
  }

  return { session: session as unknown as AdminSession, error: null }
}
