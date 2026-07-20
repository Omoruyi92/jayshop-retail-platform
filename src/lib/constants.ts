import { titleCase } from './text'

export const MAIN_CATEGORIES = ['men', 'women', 'kids', 'accessories', 'sport', 'blanks', 'authentication'] as const

export const AUDIENCES = ['Men', 'Women', 'Kids'] as const

export const KIDS_AGE_GROUPS = ['Infant', 'Toddler', 'Child', 'Youth'] as const

export const PRODUCT_TYPES = [
  'Jerseys',
  'Fleece',
  'T-Shirts',
  'Hats',
  'Hoodies',
  'Caps',
  'Accessories',
  'Collectibles',
] as const

// Main category -> product type options displayed in admin and customer filters.
export const PRODUCT_TYPES_BY_CAT: Record<string, string[]> = {
  men: ['Jerseys', 'Fleece', 'T-Shirts', 'Hats', 'Hoodies'],
  women: ['Jerseys', 'Fleece', 'T-Shirts', 'Hats', 'Hoodies'],
  kids: ['Jerseys', 'Fleece', 'T-Shirts', 'Hats', 'Hoodies'],
  accessories: ['Hats', 'Caps', 'Accessories', 'Collectibles'],
  sport: ['Jerseys', 'T-Shirts', 'Hats', 'Hoodies', 'Accessories'],
  blanks: ['Jerseys', 'T-Shirts', 'Hoodies', 'Fleece'],
  authentication: ['Jerseys', 'Hats', 'Accessories'],
  featured: ['Jerseys', 'Fleece', 'T-Shirts', 'Hats', 'Hoodies'],
  'sales-clearance': ['Jerseys', 'Fleece', 'T-Shirts', 'Hats', 'Hoodies'],
}

// Backward-compatible flat subcategory map used by legacy nav fallbacks and customer mega menu.
export const SUBS_BY_CAT: Record<string, string[]> = {
  men: ['jerseys', 'fleece', 't-shirts', 'hats', 'hoodies'],
  women: ['jerseys', 'fleece', 't-shirts', 'hats', 'hoodies'],
  kids: ['infant', 'toddler', 'child', 'youth'],
  accessories: ['hats', 'caps', 'accessories', 'collectibles'],
  sport: ['jerseys', 't-shirts', 'hats', 'hoodies', 'accessories'],
  blanks: ['jerseys', 't-shirts', 'hoodies', 'fleece'],
  authentication: ['jerseys', 'hats', 'accessories'],
}

export const BRANDS_BY_CAT: Record<string, string[]> = {
  men: ['Nike', 'New Era', 'Fanatics', 'Majestic', '47 Brand'],
  women: ['Nike', 'New Era', 'Fanatics', 'Majestic'],
  kids: ['Nike', 'New Era', 'Fanatics', 'Majestic'],
  accessories: ['New Era', '47 Brand', 'Fanatics'],
  sport: ['Nike', 'New Era', 'Fanatics'],
  blanks: ['Fanatics', 'Champion', 'Majestic'],
  authentication: ['Fanatics', 'Majestic'],
}

// Product image upload validation (used by Add Product and Edit Product forms)
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
export const MAX_IMAGE_SIZE_MB = 5
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

export function brandToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const SIZELESS_SUBS = new Set(['accessories', 'mugs', 'bobbleheads', 'caps', 'collectibles'])

export const POPULAR_BRANDS = [
  'Nike',
  'New Era',
  'Peace Collective',
  'Adidas',
  'Fanatics',
  '47 Brand',
  'Mitchell & Ness',
  'Majestic',
  'Under Armour',
  'Champion',
] as const

export const HAT_STYLES = [
  '59FIFTY',
  '39THIRTY',
  '9FIFTY',
  '9FORTY',
  'Bucket',
  'Trucker',
  'Snapback',
  'Beanie',
  'Visor',
] as const

export const KIDS_SUBCATEGORIES = ['infant', 'toddler', 'child', 'child-youth', 'youth'] as const

export const KIDS_SIZE_MAP: Record<string, string[]> = {
  infant: ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'],
  toddler: ['2T', '3T', '4T', '5T'],
  child: ['4', '5', '6', '6X'],
  'child-youth': ['XS', 'S', 'M', 'L'],
  youth: ['XS', 'S', 'M', 'L', 'XL'],
}

export function getDefaultSizes(subcategory: string): string {
  const sizes = KIDS_SIZE_MAP[subcategory]
  if (sizes) return sizes.join(',')
  if (subcategory === 'hats') {
    return '6 7/8,7,7 1/8,7 1/4,7 3/8,7 1/2,7 5/8,7 3/4,7 7/8,8,S/M,M/L,L/XL'
  }
  return 'S,M,L,XL,2XL,3XL'
}

export interface ColorSwatch {
  name: string
  hex: string
}

export const COLOR_LIBRARY: ColorSwatch[] = [
  { name: 'Sky Blue',       hex: '#87CEEB' },
  { name: 'Royal Blue',     hex: '#1E3A8A' },
  { name: 'Navy Blue',      hex: '#0B1F3A' },
  { name: 'Baby Blue',      hex: '#89CFF0' },
  { name: 'Powder Blue',    hex: '#B0E0E6' },
  { name: 'Carolina Blue',  hex: '#4B9CD3' },
  { name: 'Red',            hex: '#D32F2F' },
  { name: 'Scarlet Red',    hex: '#B22222' },
  { name: 'Maroon',         hex: '#800000' },
  { name: 'Burgundy',       hex: '#800020' },
  { name: 'Forest Green',   hex: '#228B22' },
  { name: 'Emerald Green',  hex: '#0F9D58' },
  { name: 'Kelly Green',    hex: '#4CBB17' },
  { name: 'Olive Green',    hex: '#6B8E23' },
  { name: 'Heather Grey',   hex: '#A9A9A9' },
  { name: 'Charcoal Grey',  hex: '#36454F' },
  { name: 'Light Grey',     hex: '#D3D3D3' },
  { name: 'Dark Grey',      hex: '#4B4B4B' },
  { name: 'Black',          hex: '#111111' },
  { name: 'White',          hex: '#FFFFFF' },
  { name: 'Cream',          hex: '#FFFDD0' },
  { name: 'Beige',          hex: '#F5F5DC' },
  { name: 'Tan',            hex: '#D2B48C' },
  { name: 'Brown',          hex: '#8B4513' },
  { name: 'Orange',         hex: '#FF7A00' },
  { name: 'Yellow',         hex: '#FFD500' },
  { name: 'Gold',           hex: '#D4AF37' },
  { name: 'Purple',         hex: '#6A0DAD' },
  { name: 'Pink',           hex: '#FF69B4' },
  { name: 'Lavender',       hex: '#B57EDC' },
  { name: 'Multi-color',    hex: 'linear-gradient(90deg,#D32F2F,#FFD500,#0F9D58,#1E3A8A,#6A0DAD)' },
]

export function colorToSwatch(value: string): string {
  const match = COLOR_LIBRARY.find((c) => c.name.toLowerCase() === value.trim().toLowerCase())
  if (match) return match.hex
  return value
}

export function categoryHasAudience(category: string): boolean {
  const c = category.toLowerCase()
  return ['featured', 'sport', 'authentic', 'authentication', 'sales-clearance'].includes(c)
}

export function categoryHasAgeGroup(category: string): boolean {
  return category.toLowerCase() === 'kids'
}

export function categoryHasProductType(category: string): boolean {
  return true
}

export function productTypesForCategory(category: string): string[] {
  return PRODUCT_TYPES_BY_CAT[category.toLowerCase()] ?? PRODUCT_TYPES_BY_CAT.men
}

export function audiencesForCategory(category: string): string[] {
  const c = category.toLowerCase()
  if (c === 'kids') return KIDS_AGE_GROUPS as unknown as string[]
  if (categoryHasAudience(category)) return [...AUDIENCES]
  return []
}

export function displayCategoryName(slug: string): string {
  if (slug.toLowerCase() === 'sales-clearance') return 'Sales & Clearance'
  if (slug.toLowerCase() === 'authentication') return 'Authentic'
  return titleCase(slug)
}
