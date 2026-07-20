import { AdminRole } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export const roleOrder: AdminRole[] = ['VIEWER', 'STAFF', 'MANAGER', 'OWNER']

export function rank(role: AdminRole | string | undefined | null): number {
  if (!role) return -1
  const idx = roleOrder.indexOf(role as AdminRole)
  return idx === -1 ? -1 : idx
}

/**
 * Maps a domain action to the minimum role allowed.
 */
export function actionMinRole(action: string): AdminRole {
  switch (action) {
    case 'inventory:read':
      return 'STAFF'
    case 'inventory:write':
      return 'MANAGER'
    case 'holds:read':
      return 'STAFF'
    case 'holds:resolve':
      return 'STAFF'
    case 'transfers:create':
      return 'MANAGER'
    case 'pos-keys:manage':
      return 'OWNER'
    case 'game-days:manage':
      return 'MANAGER'
    case 'hold-settings:manage':
      return 'MANAGER'
    case 'analytics:read':
      return 'VIEWER'
    case 'reports:read':
      return 'VIEWER'
    case 'history:read':
      return 'VIEWER'
    case 'pos-events:read':
      return 'STAFF'
    case 'players:read':
      return 'STAFF'
    case 'players:write':
      return 'MANAGER'
    case 'brands:read':
      return 'STAFF'
    case 'brands:write':
      return 'MANAGER'
    case 'feedback:read':
      return 'VIEWER'
    case 'feedback:write':
      return 'MANAGER'
    case 'reviews:read':
      return 'VIEWER'
    case 'reviews:write':
      return 'MANAGER'
    case 'promotions:read':
      return 'STAFF'
    case 'promotions:write':
      return 'MANAGER'
    case 'gallery:read':
      return 'STAFF'
    case 'gallery:write':
      return 'MANAGER'
    case 'categories:read':
      return 'STAFF'
    case 'categories:write':
      return 'MANAGER'
    case 'products:write':
      return 'MANAGER'
    case 'products:delete':
      return 'MANAGER'
    case 'admin:manage':
      return 'OWNER'
    case 'tenant:manage':
      return 'OWNER'
    default:
      return 'OWNER'
  }
}

/**
 * Returns true if the given role is allowed to perform an action.
 */
export function can(role: AdminRole | string | undefined | null, action: string): boolean {
  if (!role) return false
  return rank(role) >= rank(actionMinRole(action))
}

export type AdminSession = {
  user: {
    adminId: string
    email?: string | null
    role: AdminRole
    name?: string | null
    image?: string | null
  }
  expires: string
}

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
