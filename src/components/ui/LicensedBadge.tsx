import { cn } from '@/lib/utils'

interface Props {
  variant?: 'card' | 'detail'
  className?: string
}

export default function LicensedBadge({ variant = 'card', className }: Props) {
  if (variant === 'detail') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-jays-navy/30 bg-jays-ice text-jays-navy text-xs font-semibold uppercase tracking-wide',
          className
        )}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Officially Licensed
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-jays-navy/90 text-white text-[10px] font-semibold uppercase tracking-wide',
        className
      )}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Licensed
    </span>
  )
}
