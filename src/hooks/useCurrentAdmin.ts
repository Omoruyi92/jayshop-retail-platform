'use client'

import { useSession } from 'next-auth/react'
import { can } from '@/lib/auth/authorize'
import type { AdminRole } from '@prisma/client'

export function useCurrentAdmin() {
  const { data: session } = useSession()
  const role = (session?.user?.role as AdminRole | undefined) ?? undefined
  const email = session?.user?.email ?? undefined

  return {
    role,
    email,
    isOwner: role === 'OWNER',
    isManager: role === 'MANAGER' || role === 'OWNER',
    isStaff: role === 'STAFF' || role === 'MANAGER' || role === 'OWNER',
    isViewer: role === 'VIEWER',
    can: (action: string) => can(role, action),
  }
}
