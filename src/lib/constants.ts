export const MAIN_CATEGORIES = ['men', 'women', 'kids', 'accessories'] as const

export function brandToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export const SUBS_BY_CAT: Record<string, string[]> = {
  men:         ['jerseys', 'fleece', 't-shirts', 'hats', 'accessories'],
  women:       ['jerseys', 'fleece', 't-shirts', 'hats', 'accessories'],
  kids:        ['infant', 'toddler', 'child', 'child-youth', 'youth'],
  accessories: ['mugs', 'bobbleheads', 'accessories'],
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
