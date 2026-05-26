import { cn } from '@/lib/utils'

interface TableWrapperProps {
  children: React.ReactNode
  className?: string
}

export function TableWrapper({ children, className }: TableWrapperProps) {
  return (
    <div className={cn('overflow-x-auto w-full rounded-2xl border border-border shadow-sm bg-white', className)}>
      {children}
    </div>
  )
}
