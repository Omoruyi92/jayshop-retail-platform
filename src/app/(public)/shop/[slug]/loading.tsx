import BrandedLoading from '@/components/ui/BrandedLoading'

// Segment-level loading boundary so within-segment navigations (e.g.
// /shop -> /shop/[slug]) also show the branded loading state.
export default function Loading() {
  return <BrandedLoading />
}
