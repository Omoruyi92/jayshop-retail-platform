import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { AdminRole } from '@prisma/client'

const roleOrder: AdminRole[] = ['VIEWER', 'STAFF', 'MANAGER', 'OWNER']

function rank(role?: AdminRole | string | null): number {
  if (!role) return -1
  return roleOrder.indexOf(role as AdminRole)
}

type Restriction = { prefix: string; minRole: AdminRole; methods?: string[] }

// Path prefixes requiring a minimum role. Longer/more-specific prefixes should
// appear before shorter ones so they take precedence. A missing `methods`
// field means the restriction applies to every HTTP method.
const restrictedPaths: Restriction[] = [
  // Owner-only system configuration
  { prefix: '/admin/admins', minRole: 'OWNER' },
  { prefix: '/admin/settings', minRole: 'OWNER' },
  { prefix: '/admin/audit-log', minRole: 'OWNER' },
  { prefix: '/admin/pos-keys', minRole: 'OWNER' },
  { prefix: '/admin/pos-simulator', minRole: 'OWNER' },
  { prefix: '/api/admin/admins', minRole: 'OWNER' },
  // Allow any authenticated admin to change their own password
  { prefix: '/api/admin/settings/password', minRole: 'VIEWER', methods: ['POST', 'PATCH'] },
  { prefix: '/api/admin/settings', minRole: 'OWNER' },
  { prefix: '/api/admin/audit-log', minRole: 'OWNER' },
  { prefix: '/api/admin/pos-keys', minRole: 'OWNER' },
  { prefix: '/api/admin/pos-simulator', minRole: 'OWNER' },

  // Manager+ operations
  { prefix: '/admin/hold-settings', minRole: 'MANAGER' },
  { prefix: '/admin/game-days', minRole: 'MANAGER' },
  { prefix: '/admin/reports', minRole: 'MANAGER' },
  { prefix: '/admin/categories', minRole: 'MANAGER' },
  { prefix: '/admin/brands', minRole: 'MANAGER' },
  { prefix: '/admin/gallery', minRole: 'MANAGER' },
  { prefix: '/admin/players', minRole: 'MANAGER' },
  { prefix: '/admin/promotions', minRole: 'MANAGER' },
  { prefix: '/api/admin/hold-settings', minRole: 'MANAGER' },
  { prefix: '/api/admin/game-days', minRole: 'MANAGER' },
  { prefix: '/api/admin/reports', minRole: 'MANAGER' },
  { prefix: '/api/admin/categories', minRole: 'MANAGER' },
  { prefix: '/api/admin/brands', minRole: 'MANAGER' },
  { prefix: '/api/admin/gallery', minRole: 'MANAGER' },
  { prefix: '/api/admin/players', minRole: 'MANAGER' },
  { prefix: '/api/admin/promotions', minRole: 'MANAGER' },
  { prefix: '/api/admin/inventory/transfer', minRole: 'MANAGER' },
  // Products: read for Viewer+, write for Manager+
  { prefix: '/api/admin/products', minRole: 'MANAGER', methods: ['POST', 'PUT', 'PATCH', 'DELETE'] },

  // Staff+ daily operations
  { prefix: '/admin/holds', minRole: 'STAFF' },
  { prefix: '/admin/inventory/history', minRole: 'STAFF' },
  { prefix: '/admin/pos-events', minRole: 'STAFF' },
  { prefix: '/admin/history', minRole: 'STAFF' },
  { prefix: '/admin/reviews', minRole: 'STAFF' },
  { prefix: '/admin/feedback', minRole: 'STAFF' },
  { prefix: '/admin/notifications', minRole: 'STAFF' },
  { prefix: '/api/admin/holds', minRole: 'STAFF' },
  { prefix: '/api/admin/inventory/history', minRole: 'STAFF' },
  { prefix: '/api/admin/pos-events', minRole: 'STAFF' },
  { prefix: '/api/admin/history', minRole: 'STAFF' },
  { prefix: '/api/admin/reviews', minRole: 'STAFF' },
  { prefix: '/api/admin/feedback', minRole: 'STAFF' },
  { prefix: '/api/admin/notifications', minRole: 'STAFF' },
]

function minRoleForPath(pathname: string, method: string): { minRole: AdminRole; applies: boolean } | null {
  for (const { prefix, minRole, methods } of restrictedPaths) {
    if (pathname.startsWith(prefix)) {
      if (!methods || methods.includes(method)) {
        return { minRole, applies: true }
      }
      return { minRole, applies: false }
    }
  }
  return null
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname
    const method = req.method
    const token = req.nextauth.token
    const restriction = minRoleForPath(pathname, method)

    if (restriction?.applies && rank(token?.role) < rank(restriction.minRole)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

// Protect all /admin routes (except login) and all /api/admin routes
export const config = {
  matcher: ['/admin/((?!login).*)', '/api/admin/(.*)'],
}
