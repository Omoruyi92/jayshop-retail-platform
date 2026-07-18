import { cn } from '@/lib/utils'

const BADGE_STYLES: Record<string, string> = {
  ACTIVE:               'bg-green-100 text-green-700',
  PICKED_UP:            'bg-blue-100 text-blue-700',
  FULFILLED:            'bg-blue-100 text-blue-700',
  RELEASED:             'bg-orange-100 text-orange-700',
  EXPIRED:              'bg-gray-100 text-gray-500',
  PARTIALLY_FULFILLED:  'bg-yellow-100 text-yellow-700',
  AVAILABLE:            'bg-green-100 text-green-700',
  ON_HOLD:              'bg-amber-100 text-amber-700',
  SOLD:                 'bg-gray-100 text-gray-500',
  SOLD_OUT:             'bg-red-100 text-red-600',
  ARCHIVED:             'bg-gray-100 text-gray-400',
  IN_STOCK:             'bg-green-100 text-green-700',
  LOW_STOCK:            'bg-yellow-100 text-yellow-700',
  OUT_OF_STOCK:         'bg-red-100 text-red-600',
}

const BADGE_LABELS: Record<string, string> = {
  AVAILABLE: 'In Stock',
  ON_HOLD: 'Held',
  SOLD: 'Sold',
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
}

export function StatusBadge({
  status,
  className,
  label,
  sold,
  held,
}: {
  status: string
  className?: string
  /** Optional override for the rendered text (e.g. "1 Held", "3 Sold"). */
  label?: string
  /** Live sold count to show as a secondary pill. */
  sold?: number
  /** Live held count to show as a secondary pill. */
  held?: number
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
          BADGE_STYLES[status] ?? 'bg-gray-100 text-gray-500'
        )}
      >
        {label ?? BADGE_LABELS[status] ?? status.replace(/_/g, ' ')}
      </span>
      {typeof held === 'number' && held > 0 && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap bg-amber-100 text-amber-700">
          {held} Held
        </span>
      )}
      {typeof sold === 'number' && sold > 0 && (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap bg-gray-100 text-gray-500">
          {sold} Sold
        </span>
      )}
    </span>
  )
}
