/**
 * Storefront theme catalogue. Each entry maps to a `.theme-*` class defined
 * in `src/app/globals.css` that overrides the shared HSL custom properties
 * declared on `:root`. Keep this list in sync with globals.css — adding a
 * theme here without a matching CSS class is a no-op (falls back to
 * whatever is already on `:root`/`.theme-default`).
 */
export const THEMES = ['default', 'canada-red', 'powder-grey', 'city-connect'] as const

export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'default'

export const THEME_CLASS: Record<Theme, string> = {
  default: 'theme-default',
  'canada-red': 'theme-canada-red',
  'powder-grey': 'theme-powder-grey',
  'city-connect': 'theme-city-connect',
}

export const THEME_LABELS: Record<Theme, string> = {
  default: 'Blue Jays Blue',
  'canada-red': 'Canada Day Red',
  'powder-grey': 'Powder Grey',
  'city-connect': 'City Connect Navy',
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

/** All theme class names, used to strip stale classes before applying the current one. */
export const ALL_THEME_CLASSES = Object.values(THEME_CLASS)
