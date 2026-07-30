import BrandedLoading from '@/components/ui/BrandedLoading'

// The homepage lives in its own nested route group so it gets a dedicated
// loading boundary: a group-level loading.tsx never fires for its sibling
// page.tsx, so navigations back to `/` would otherwise show no loading state.
export default function Loading() {
  return <BrandedLoading />
}
