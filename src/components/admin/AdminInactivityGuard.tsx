'use client'
import { useAdminSessionTimeout } from '@/hooks/useAdminSessionTimeout'

export default function AdminInactivityGuard({
  children,
}: {
  children: React.ReactNode
}) {
  useAdminSessionTimeout()
  return <>{children}</>
}
