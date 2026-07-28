import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminSessionProvider from '@/components/admin/AdminSessionProvider'
import AdminUserProfile from '@/components/admin/AdminUserProfile'
import AdminInactivityGuard from '@/components/admin/AdminInactivityGuard'
import { DataProvider } from '@/components/sync/DataProvider'

export const metadata: Metadata = {
  title: {
    default: 'Admin | Jays Shop',
    template: '%s — Admin | Jays Shop',
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <AdminSessionProvider session={session}>
      <DataProvider>
        <AdminInactivityGuard>
          <div data-admin-root className="h-screen flex bg-jays-ice overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 min-w-0 overflow-y-auto h-full">
              <main className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-14 lg:pt-8">
                <AdminUserProfile />
                <div className="max-w-6xl mx-auto">{children}</div>
              </main>
            </div>
          </div>
        </AdminInactivityGuard>
      </DataProvider>
    </AdminSessionProvider>
  )
}
