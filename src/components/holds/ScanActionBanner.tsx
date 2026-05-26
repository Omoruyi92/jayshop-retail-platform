'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reservationCode: string
}

export default function ScanActionBanner({ reservationCode }: Props) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checked, setChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.adminId) {
          setIsAdmin(true)
        }
      })
      .catch(() => {/* not an admin */})
      .finally(() => setChecked(true))
  }, [reservationCode])

  // While checking session, render nothing
  if (!checked || !isAdmin) return null

  function handleResolve() {
    router.push(`/admin/holds?code=${encodeURIComponent(reservationCode)}&autoOpen=true`)
  }

  return (
    <div className="sticky top-0 z-50 bg-jays-navy border-b-2 border-jays-red px-4 py-3 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2 text-white text-sm font-medium">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-jays-red text-white text-xs font-bold">S</span>
        <span>Staff view — <span className="font-mono">{reservationCode}</span></span>
      </div>
      <button
        onClick={handleResolve}
        className="bg-jays-red text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors min-h-[36px] shrink-0"
      >
        Resolve Hold
      </button>
    </div>
  )
}
