import { cn } from '@/lib/utils'

interface Props {
  variant?: 'card' | 'detail' | 'banner'
  className?: string
}

export default function ChampionBadge({ variant = 'card', className }: Props) {
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'w-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-jays-navy py-2 px-4 flex items-center justify-center gap-2 font-display font-bold text-sm uppercase tracking-widest',
          className
        )}
      >
        <TrophyIcon size={16} />
        <span>ALC Champions 2025</span>
        <TrophyIcon size={16} />
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-400 text-jays-navy text-xs font-bold uppercase tracking-wide',
          className
        )}
      >
        <TrophyIcon size={12} />
        ALC Champs 2025
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-400 text-jays-navy text-[10px] font-bold uppercase tracking-wide',
        className
      )}
    >
      <TrophyIcon size={9} />
      ALC 2025
    </span>
  )
}

function TrophyIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 2h12v6a6 6 0 01-12 0V2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M6 4H3a3 3 0 003 3M18 4h3a3 3 0 01-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14v4M8 22h8M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
