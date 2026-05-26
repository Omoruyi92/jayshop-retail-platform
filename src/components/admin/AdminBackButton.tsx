'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  fallbackHref?: string
  label?: string
}

export default function AdminBackButton({ fallbackHref = '/admin', label = 'Dashboard' }: Props) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(fallbackHref)}
      className="inline-flex items-center gap-1 text-sm text-jays-steel hover:text-jays-navy transition-colors duration-150 mb-4 -ml-0.5 group"
      aria-label={`Back to ${label}`}
    >
      <ChevronLeft
        size={16}
        className="transition-transform duration-150 group-hover:-translate-x-0.5"
      />
      <span>{label}</span>
    </button>
  )
}
