import { StatusBadge } from './StatusBadge'

// StatusChip is a named alias kept for backward compatibility with existing imports.
export default function StatusChip({
  status,
  sold,
  held,
}: {
  status: string
  sold?: number
  held?: number
}) {
  return <StatusBadge status={status} sold={sold} held={held} />
}
