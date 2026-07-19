'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'

export default function AdminUserProfile() {
  const { data: session } = useSession()
  const email = session?.user?.email

  return (
    <div className="flex items-center justify-end gap-3 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 rounded-full bg-white border border-jays-navy/10 px-3 py-1.5 shadow-sm">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-jays-royal/10 text-jays-royal">
          <User size={14} />
        </span>
        <span className="hidden sm:inline text-sm font-medium text-jays-navy max-w-[180px] truncate" title={email ?? ''}>
          {email ?? 'Admin'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/admin/login' })}
        className="flex items-center gap-1.5 rounded-full bg-jays-royal hover:bg-jays-navy text-white text-xs font-semibold uppercase tracking-wide px-3.5 py-2 transition-colors"
      >
        <LogOut size={13} />
        <span className="hidden sm:inline">Sign Out</span>
        <span className="sm:hidden">Out</span>
      </button>
    </div>
  )
}
