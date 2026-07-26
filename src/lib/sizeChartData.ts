// Shared size chart data, single source of truth for:
//  - the full `/size-chart` page (src/app/(public)/size-chart/page.tsx)
//  - the PDP-local "Size Chart" dropdown (src/components/shop/PdpSizeChart.tsx)
//
// Numbers here must stay in sync with the full page — this module was
// extracted from that page's previously-inline JSX tables so both surfaces
// render identical sizing data instead of drifting over time.

export const MENS_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const
export const MENS_CHEST: Record<(typeof MENS_SIZES)[number], string> = {
  XS: '32-34', S: '35-37', M: '38-40', L: '41-43', XL: '44-46', '2XL': '48-50', '3XL': '52-54',
}
export const MENS_WAIST: Record<(typeof MENS_SIZES)[number], string> = {
  XS: '26-28', S: '29-31', M: '32-34', L: '35-37', XL: '38-40', '2XL': '42-44', '3XL': '46-48',
}

export const WOMENS_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'] as const
export const WOMENS_BUST: Record<(typeof WOMENS_SIZES)[number], string> = {
  XS: '30-32', S: '33-35', M: '36-38', L: '39-41', XL: '42-44', '2XL': '46-48',
}
export const WOMENS_WAIST: Record<(typeof WOMENS_SIZES)[number], string> = {
  XS: '24-26', S: '27-29', M: '30-32', L: '33-35', XL: '36-38', '2XL': '40-42',
}

export const KIDS_ROWS = [
  { size: 'Infant', age: '0-12 months', chest: '17-19' },
  { size: 'Toddler', age: '2T-4T', chest: '19-22' },
  { size: 'Child', age: '5-7 years', chest: '22-25' },
  { size: 'Child Youth', age: '8-14 years', chest: '26-31' },
  { size: 'Youth', age: '15-18 years', chest: '32-34' },
] as const

export const HAT_ROWS = [
  { size: '6⅞', inch: '21⅝', cm: '54.9' },
  { size: '7', inch: '22', cm: '55.9' },
  { size: '7⅛', inch: '22⅜', cm: '56.8' },
  { size: '7¼', inch: '22¾', cm: '57.8' },
  { size: '7⅜', inch: '23⅛', cm: '58.7' },
  { size: '7½', inch: '23½', cm: '59.7' },
  { size: '7⅝', inch: '23⅞', cm: '60.6' },
  { size: '7¾', inch: '24¼', cm: '61.6' },
  { size: '8', inch: '25', cm: '63.5' },
] as const

export type SizeChartKind = 'mens' | 'womens' | 'kids' | 'hats'

/**
 * Resolve which size chart(s) to show for a given product, based on the
 * same `category` / `productType` / `hatStyle` fields already established
 * for men/women/kids category + free-text product type (see
 * prisma/schema.prisma Product model + src/lib/constants.ts).
 *
 * Returns an ordered list (most relevant first) since a product can
 * reasonably match more than one lens — e.g. a kids category product still
 * benefits from seeing the kids chart only, while a men's hat should show
 * the hat chart, not the apparel chest/waist chart.
 */
export function resolveSizeChartKinds(product: {
  category?: string | null
  productType?: string | null
  hatStyle?: string | null
  ageGroup?: string | null
}): SizeChartKind[] {
  const category = (product.category || '').toLowerCase()
  const productType = (product.productType || '').toLowerCase()
  const hatStyle = (product.hatStyle || '').toLowerCase()

  const isHat = hatStyle.length > 0 || /hat|cap|beanie|bucket|snapback|visor/.test(productType)
  const isKids = category === 'kids' || (product.ageGroup || '').length > 0

  if (isHat) return ['hats']
  if (isKids) return ['kids']
  if (category === 'women') return ['womens']
  // men, accessories, sport, blanks, authentication, and anything else with
  // apparel sizing (jerseys/fleece/t-shirts/hoodies) default to the
  // men's/unisex chart, matching how the full /size-chart page labels it.
  return ['mens']
}

export const SIZE_CHART_LABELS: Record<SizeChartKind, string> = {
  mens: "Men's / Unisex",
  womens: "Women's",
  kids: 'Kids / Youth',
  hats: 'Hat Sizing',
}
