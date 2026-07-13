export const MAIN_CATEGORIES = ['men', 'women', 'kids', 'accessories', 'sport', 'blanks'] as const

export function brandToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const SUBS_BY_CAT: Record<string, string[]> = {
  men:         ['jerseys', 'fleece', 't-shirts', 'hats', 'accessories'],
  women:       ['jerseys', 'fleece', 't-shirts', 'hats', 'accessories'],
  kids:        ['infant', 'toddler', 'child', 'child-youth', 'youth'],
  accessories: ['mugs', 'bobbleheads', 'accessories'],
  sport:       ['jerseys', 'fleece', 't-shirts', 'hats'],
  blanks:      ['t-shirts', 'jerseys', 'hoodies'],
}

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

export const BRANDS_BY_CAT: Record<string, string[]> = {
  men:         ['Nike', 'New Era', 'Peace Collective', 'Adidas', 'Fanatics', '47 Brand', 'Mitchell & Ness'],
  women:       ['Nike', 'New Era', 'Peace Collective', 'Adidas', 'Fanatics'],
  kids:        ['Nike', 'New Era', 'Peace Collective', 'Fanatics'],
  accessories: ['Nike', 'New Era', '47 Brand', 'Fanatics', 'Mitchell & Ness'],
  sport:       ['Nike', 'Adidas', 'Under Armour', 'Champion', 'Fanatics'],
  blanks:      ['Fanatics', 'Champion', 'Majestic'],
}

export const SIZELESS_SUBS = new Set(['accessories', 'mugs', 'bobbleheads'])

export const KIDS_SUBCATEGORIES = ['infant', 'toddler', 'child', 'child-youth', 'youth'] as const

export const KIDS_SIZE_MAP: Record<string, string> = {
  'infant':      '12M,18M,24M',
  'toddler':     '2T,3T,4T',
  'child':       '5,6,7',
  'child-youth': '8,10/12',
  'youth':       '15/16',
}

export function getDefaultSizes(subcategory: string): string {
  if (KIDS_SIZE_MAP[subcategory]) return KIDS_SIZE_MAP[subcategory]
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
