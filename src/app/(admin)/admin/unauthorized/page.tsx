import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function AdminUnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
      <h1 className="text-2xl font-bold text-jays-navy">Access Denied</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Your account does not have permission to view this page. If you believe this is a
        mistake, contact an administrator to review your role.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex items-center rounded-lg bg-jays-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-jays-navy/90"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
