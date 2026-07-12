'use client'
import { cn } from '@/lib/utils'

/**
 * "LET'S GO JAYS" repeating text watermark overlay.
 * Renders at very low opacity so content stays readable.
 * Drop into any section with `position: relative` and `overflow: hidden`.
 */
interface Props {
  className?: string
  /** Override text color — default is white (for dark backgrounds) */
  color?: 'white' | 'navy'
  /** Density control — default 'normal' */
  density?: 'light' | 'normal' | 'dense'
}

export default function LetsGoJaysWatermark({ className, color = 'white', density = 'normal' }: Props) {
  const textColor = color === 'navy' ? 'text-jays-navy' : 'text-white'

  const gapMap = { light: 120, normal: 90, dense: 60 }
  const gap = gapMap[density]
  const rows = Math.ceil(1200 / gap)

  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none select-none',
        className,
      )}
    >
      {Array.from({ length: rows }).map((_, i) => {
        const topPct = (i * gap / 12).toFixed(1)
        const offsetX = i % 2 === 0 ? '-5%' : '-15%'

        return (
          <div
            key={i}
            className={cn(
              'absolute whitespace-nowrap font-display font-black uppercase tracking-[0.35em] animate-scroll-left',
              textColor,
              density === 'dense' ? 'text-sm sm:text-base lg:text-lg' :
              density === 'light' ? 'text-base sm:text-lg lg:text-xl' :
              'text-sm sm:text-base lg:text-lg',
            )}
            style={{
              top: `${topPct}%`,
              left: offsetX,
              opacity: color === 'navy' ? 0.018 : 0.022,
              transform: 'rotate(-12deg)',
              width: '200%',
              animationDuration: `${55 + (i % 4) * 8}s`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
            }}
          >
            {"LET'S GO JAYS · LET'S GO JAYS · LET'S GO JAYS · LET'S GO JAYS · LET'S GO JAYS · LET'S GO JAYS · LET'S GO JAYS · LET'S GO JAYS · "}
          </div>
        )
      })}
    </div>
  )
}
