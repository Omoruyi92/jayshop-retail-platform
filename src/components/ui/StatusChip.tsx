import { StatusBadge } from './StatusBadge'

// StatusChip is a named alias kept for backward compatibility with existing imports.
export default function StatusChip({ status }: { status: string }) {
  return <StatusBadge status={status} />
}
