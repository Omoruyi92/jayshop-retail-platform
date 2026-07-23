import { cn } from '@/lib/utils'

interface TableWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wraps admin tables in a horizontally scrollable container. On narrow
 * viewports these tables are wider than the screen, so beyond the built-in
 * `overflow-x-auto` we render a persistent "scroll shadow" (pure CSS, no JS)
 * on the edges whenever there's more content to reveal, plus a one-time
 * mobile-only hint so users know the table can be swiped horizontally.
 */
export function TableWrapper({ children, className }: TableWrapperProps) {
  return (
    <div className={cn('rounded-2xl border border-border shadow-sm bg-white overflow-hidden', className)}>
      <p className="sm:hidden text-[10px] text-jays-steel text-center py-1 bg-jays-ice/60 border-b border-border">
        ← Swipe table to see more →
      </p>
      <div
        className="overflow-x-auto w-full scroll-shadow"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 30%, rgba(255,255,255,0)), linear-gradient(to right, rgba(255,255,255,0), white 70%) 100% 0, linear-gradient(to right, rgba(0,0,0,.12), rgba(0,0,0,0)), linear-gradient(to left, rgba(0,0,0,.12), rgba(0,0,0,0)) 100% 0',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'white',
          backgroundSize: '40px 100%, 40px 100%, 14px 100%, 14px 100%',
          backgroundPosition: '0 0, 100% 0, 0 0, 100% 0',
          backgroundAttachment: 'local, local, scroll, scroll',
        }}
      >
        {children}
      </div>
    </div>
  )
}
