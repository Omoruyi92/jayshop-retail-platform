interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  body?: string
}

export function EmptyState({ icon, title, body }: EmptyStateProps) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-jays-steel">
      {icon && <div className="text-jays-steel/40">{icon}</div>}
      <p className="text-sm font-medium text-jays-navy">{title}</p>
      {body && <p className="text-xs text-muted-foreground text-center max-w-xs">{body}</p>}
    </div>
  )
}
