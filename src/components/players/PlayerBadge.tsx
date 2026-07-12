type Props = {
  isFeatured?: boolean
  isTrending?: boolean
  isNewArrival?: boolean
  className?: string
}

export default function PlayerBadge({ isFeatured, isTrending, isNewArrival, className = '' }: Props) {
  if (!isFeatured && !isTrending && !isNewArrival) return null

  const badge = isFeatured
    ? { label: 'Featured', classes: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-jays-navy' }
    : isTrending
    ? { label: 'Trending', classes: 'bg-jays-red text-white' }
    : { label: 'New', classes: 'bg-jays-royal text-white' }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${badge.classes} ${className}`}
    >
      {badge.label}
    </span>
  )
}
