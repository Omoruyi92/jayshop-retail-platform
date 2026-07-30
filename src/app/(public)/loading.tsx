import BrandedLoading from '@/components/ui/BrandedLoading'

// Route-group-level loading boundary: covers every public route (`/`, /shop,
// /shop/[slug], /brands, /players, /gallery, /shop-by-style, ...) that does
// not define its own deeper `loading.tsx`. Header/footer chrome from the
// (public) layout stays mounted; only the page area shows the branded state.
export default function Loading() {
  return <BrandedLoading />
}
