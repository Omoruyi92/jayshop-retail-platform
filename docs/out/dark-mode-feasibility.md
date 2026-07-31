# Dark Mode Feasibility Audit — Phase 1 (Read-Only)

**Repo:** `/Users/idehenomoruyi/projects/jays-shop`
**Scope:** Storefront + Admin dashboard
**Mode:** Read-only audit. No application code changed, no commits made.

---

## TL;DR

| Question | Answer |
|---|---|
| Does a `.dark` token set already exist? | **No.** Tailwind is configured for `darkMode: ['class']` and 18 shadcn-style CSS variable tokens exist in `:root`, but **zero** of them have a corresponding `.dark { }` value anywhere in the codebase. The plumbing is scaffolded; the dark values were never authored. |
| Headline: distinct files needing modification | **~150–160 files** (≈50% of the 313 `.ts`/`.tsx` files under `src/`) |
| Verdict | **(B) — colours are hardcoded.** This is a design-token migration, not a toggle. |
| Recommended scope | **Option 3, Foundation-only**, with Option 2 (Admin-first) as the fast-follow if the user wants a visible win sooner. Full storefront rollout is a multi-week effort on a live commercial site and should not be scoped as a single sprint. |

---

## PART 1 — Existing Theming Infrastructure

### `darkMode` strategy
`/Users/idehenomoruyi/projects/jays-shop/tailwind.config.ts` (line 4):

```ts
darkMode: ['class'],
```

Class-based strategy is configured, but no `.dark` class is ever applied to any element in the app (no theme provider, no toggle, confirmed by dedicated search for `\.dark\s*\{` across `src/` returning zero matches, and zero references to a class-mutation call like `document.documentElement.classList.add('dark')`).

### Global stylesheet — CSS custom properties
`/Users/idehenomoruyi/projects/jays-shop/src/app/globals.css`, `:root` block (all values are bare HSL triplets consumed as `hsl(var(--x))`):

| Token | `:root` value | `.dark` value |
|---|---|---|
| `--background` | `0 0% 100%` | **absent** |
| `--foreground` | `222.2 84% 4.9%` | **absent** |
| `--card` | `0 0% 100%` | **absent** |
| `--card-foreground` | `222.2 84% 4.9%` | **absent** |
| `--popover` | `0 0% 100%` | **absent** |
| `--popover-foreground` | `222.2 84% 4.9%` | **absent** |
| `--primary` | `213 74% 31%` | **absent** |
| `--primary-foreground` | `210 40% 98%` | **absent** |
| `--secondary` | `210 40% 96.1%` | **absent** |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | **absent** |
| `--muted` | `210 40% 96.1%` | **absent** |
| `--muted-foreground` | `215.4 16.3% 46.9%` | **absent** |
| `--accent` | `210 40% 96.1%` | **absent** |
| `--accent-foreground` | `222.2 47.4% 11.2%` | **absent** |
| `--destructive` | `0 84.2% 60.2%` | **absent** |
| `--destructive-foreground` | `210 40% 98%` | **absent** |
| `--border` | `214.3 31.8% 91.4%` | **absent** |
| `--input` | `214.3 31.8% 91.4%` | **absent** |
| `--ring` | `213 74% 31%` | **absent** |
| `--radius` | `0.5rem` | N/A (not a color) |

**No `.dark { }` block exists anywhere in the codebase** (confirmed via `grep_file` across all of `src/`). All 18 color tokens are "half-implemented": the Tailwind config → CSS variable → `hsl()` wiring exists, but the dark-mode values were never written.

`@layer base` in the same file:

```css
* {
  @apply border-border;
}
body {
  @apply bg-background text-foreground;
}
:focus-visible {
  @apply outline-none ring-2 ring-jays-navy/40 ring-offset-2;
}
```

However, the actual rendered `<body>` tag in `src/app/layout.tsx` carries hardcoded literal classes (`bg-jays-ice text-gray-900`) alongside this semantic rule, so in practice the semantic tokens are visually redundant/inert — the literal brand color is what determines the page background today, not the CSS variable.

### Theme provider dependency
**Absent.** No `next-themes` and no custom `ThemeProvider` in `package.json`. Present UI/animation deps: `@radix-ui/react-dialog`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner`, `tailwindcss-animate` — none of these provide theme switching.

### Brand colors
`tailwind.config.ts`, `theme.extend.colors`:

```ts
colors: {
  jays: {
    navy:  '#134A8E',
    royal: '#1D2D5C',
    red:   '#E8291C',
    white: '#FFFFFF',
    ice:   '#F0F4FA',
    steel: '#64748B',
  },
  // + shadcn semantic tokens (border/input/ring/background/foreground/
  // primary/secondary/destructive/muted/accent/popover/card) wired via hsl(var(--x))
}
```

- `jays-navy` `#134A8E` — primary brand blue (buttons, header, hero overlays)
- `jays-royal` `#1D2D5C` — darker navy variant, used for hover states and gradients
- `jays-red` `#E8291C` — accent/CTA red
- `jays-white` `#FFFFFF`
- `jays-ice` `#F0F4FA` — light background tint, used app-wide as the page background
- `jays-steel` `#64748B` — muted gray-blue for secondary text

These are static hex literals that do not shift for a dark theme and are used identically across storefront and admin.

---

## PART 2 — Hardcoded Colour Census

Counts are **distinct file counts** via `grep_file`, cross-checked against `grep_content` occurrence totals, scoped to `src/`.

| Pattern | Distinct files | Notes |
|---|---|---|
| `bg-white` | 99 | pervasive card/panel/dropdown surface color |
| `bg-black` | 15 | exclusively `bg-black/NN` modal/overlay backdrops |
| `bg-gray-*` | 47 | |
| `bg-slate-*` | 4 | |
| `bg-neutral-*` | 0 | not used |
| `text-white` | 102 | very high — used on every navy/hero surface and on navy buttons |
| `text-black` | 0 | not used |
| `text-gray-*` | 64 | |
| `text-slate-*` | 3 | |
| `border-gray-*` | 62 | |
| `border-slate-*` | 0 | not used |
| `divide-gray-*` | 4 | |
| `bg-jays-*` | 79 (for `bg-jays-navy` alone) | brand-literal backgrounds; total across all `jays-*` bg variants is higher |
| `text-jays-*` | ~104 | brand-literal text colors |
| `border-jays-*` | 41 | disambiguated from the semantic `border-border` token |
| raw hex `#[0-9a-fA-F]{6}` in `.tsx` | 17 | mostly code comments referencing hex values, plus a few inline `style` props |
| raw hex `#[0-9a-fA-F]{3}` in `.tsx` | 2 | `HoldTagPrint.tsx`, `StadiumMap.tsx` |

### Semantic token adoption (for comparison)
- `border-border`: **39 files** — the only semantic token with meaningful adoption, almost always paired with a hardcoded `bg-white` fill (e.g. `InventoryHistoryTable.tsx:153` — `"bg-white rounded-2xl border border-border p-4..."`).
- `bg-card` / `text-card-foreground`: essentially only `src/components/ui/card.tsx` itself (the shadcn primitive).
- `bg-background` / `text-foreground`: **0 files** at the JSX/component level — these only appear inside `globals.css`'s own `@layer base` rule, never referenced directly in page/component markup.

**Conclusion:** semantic tokens are present in the design system's plumbing but essentially unused in practice; nearly all visible color in the app is hardcoded literal Tailwind utilities or brand-literal classes.

### Split by surface

**(a) Storefront** (`(public)/*` route group + `src/components/{home,shop,players,gallery,styles,holds}/*`):
Hero sections (`HomeHero`, `ShopHero`, `StylesHero`, `GalleryHero`, `PlayersHero`) hardcode `bg-jays-navy` + `text-white` + gradient scrims. Product pages, cart, reviews, and header/nav chrome hardcode `bg-white` / `text-gray-*` / `border-gray-*` extensively.

**(b) Admin** (`(admin)/*` route group + `src/components/admin/*`):
Heaviest hardcoded-color surface. Every admin CRUD page (products, categories, players, styles, brands, holds, promotions, pos-keys, pos-events, pos-simulator, admins, audit-log, settings, analytics, reports, history, notifications, game-days, gallery, reviews, hero-media, hold-settings, customer-style-submissions) uses the same `bg-white ... border border-border` card pattern plus `bg-jays-navy text-white` for primary buttons and active tab/pagination states. Roughly 50+ admin files touch at least one hardcoded pattern.

**(c) Shared `src/components/ui/*`:**
`Dialog.tsx` (`bg-white` modal surface, `bg-black/50` backdrop), `Dropdown.tsx` (`bg-white border-gray-200`, `bg-jays-navy` active state), `button.tsx` (`bg-jays-navy text-white` default variant, `border-jays-navy` outline variant), `card.tsx` (uses `bg-card` — the one clean semantic exception), `TableWrapper.tsx` (`bg-white`), `PaginationControls.tsx` (`bg-jays-navy text-white` active page), `LicensedBadge.tsx`, `PartnerLogoMarquee.tsx` / `PartnerLogosBar.tsx`. These primitives are consumed by **both** storefront and admin, so a fix here has double leverage but also double blast-radius risk if regressed.

### Headline number

**Method:** union of file-path sets returned by `grep_file` for every hardcoded pattern above (`bg-white`, `bg-black`, `bg-gray-*`, `bg-slate-*`, `text-white`, `text-gray-*`, `text-slate-*`, `border-gray-*`, `divide-gray-*`, `bg-jays-*`, `text-jays-*`, `border-jays-*`, raw hex in `.tsx`). Overlap between sets is very high — most files matching `bg-jays-navy` also match `text-white`; most files matching `bg-white` also match `border-gray-*`. Repeated file paths (`Header.tsx`, `HeaderActions.tsx`, `NotificationBell.tsx`, `Dropdown.tsx`, `ProductDetails.tsx`, `ProductReviews.tsx`, `HowOthersAreWearingIt.tsx`, `EditProductModal.tsx`, `PlayerFormModal.tsx`, and nearly every `(admin)/admin/*/page.tsx`) appear across 4–8 of the twelve pattern searches each.

**Headline: ~150–160 distinct files out of 313 total `.ts`/`.tsx` files under `src/` (≈50% of the codebase)** would need modification (color-class conversion or an explicit `dark:` variant) for a complete, non-broken dark mode.

---

## PART 3 — Modal / Portal / Overlay Inventory

| Overlay surface | File | Portal to `document.body`? | Notes |
|---|---|---|---|
| Generic `Dialog`/`DialogContent` primitive | `src/components/ui/Dialog.tsx` | **Yes** (`createPortal` import; `createPortal(...)` + `document.body`) | Custom Radix replacement (comment explains a Radix infinite-render bug); `bg-black/50 backdrop-blur-sm` backdrop, `bg-white` content panel — both hardcoded |
| Generic `Dropdown` (shared select) | `src/components/ui/Dropdown.tsx` | **Yes** (`createPortal` + `document.body`) | `bg-white border-gray-200`; active item `bg-jays-navy` |
| Header language selector | `src/components/layout/Header.tsx` (lines ~230–278) | **No** — `position: fixed` via `useDropdownPosition` hook, rendered inline in the tree | `className="fixed w-36 bg-white shadow-lg rounded-lg border border-gray-100 py-1 z-50"` |
| "We Care" dropdown | `src/components/layout/Header.tsx` (lines ~183–228) | **No** — same `fixed` + `useDropdownPosition` pattern, inline | `className="fixed w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 ... z-50"` with a `bg-gradient-to-r from-jays-navy to-jays-royal` header strip |
| Mobile hamburger menu | `src/components/layout/Header.tsx` (lines ~291–341) | **No** — inline, `fixed`-positioned | `bg-white shadow-2xl rounded-xl border border-gray-100` |
| Cart/wishlist flyouts | `src/components/layout/HeaderActions.tsx` | **Yes** — two separate `createPortal` calls, both targeting `document.body` | Flyout panels use `bg-white` |
| Notification panel | `src/components/layout/NotificationBell.tsx` | **Yes** (`createPortal` + `document.body`) | `bg-white rounded-2xl shadow-2xl border-gray-100` |
| Shop category submenu | `src/components/shop/StickyShopCategoryNav.tsx` | **Yes** — explicit code comment: "Rendered via a portal to document.body (fixed viewport...)" | |
| Lightbox/gallery modal | `src/components/shop/HowOthersAreWearingIt.tsx` | **Yes** (`createPortal` + `document.body`) | |
| Admin form modals (`PlayerFormModal`, `StyleProductsModal`, `EditProductModal`, `BrandFormModal`, `ProductLocationsModal`, `GalleryFormModal`, `PromotionFormModal`, `StyleFormModal`, `TransferModal`) | `src/components/admin/*.tsx` | **Mixed / inconsistent** — several hand-roll their own `fixed inset-0 z-[60] bg-black/50` wrapper directly in the render tree rather than reusing the shared `Dialog.tsx` primitive | Inconsistent modal implementation across admin is itself a maintenance risk independent of dark mode |
| Toast notifications | `sonner` library, mounted via `<Toaster richColors position="top-center" />` in `src/app/layout.tsx` | Portal handled internally by `sonner` (third-party) | `richColors` means sonner injects its own color scheme — needs separate verification against a dark background; out of scope for source-level grep since it's a node_modules component |
| Chat FAB panel | `src/components/chat/ChatFAB.tsx` | **No** evidence of `createPortal` — renders inline via `fixed bottom-6 right-4 z-50` | `bg-jays-navy text-white` header, `bg-white` panel body |

**Total distinct files using `createPortal`: 6** — `Dialog.tsx`, `Dropdown.tsx`, `HeaderActions.tsx`, `NotificationBell.tsx`, `StickyShopCategoryNav.tsx`, `HowOthersAreWearingIt.tsx`. All use the destructured `import { createPortal } from 'react-dom'` form.

### `useDropdownPosition.ts` review
`/Users/idehenomoruyi/projects/jays-shop/src/hooks/useDropdownPosition.ts` is a `'use client'` hook that computes `position: fixed` coordinates from a trigger element's `getBoundingClientRect()` via `useLayoutEffect` plus resize/scroll listeners. It is **explicitly not a portal mechanism** — it only returns inline `CSSProperties` for the caller to spread onto a `fixed`-positioned `<div>` that stays a normal descendant in the React tree (replacing an older `absolute right-0` anchoring pattern that clipped on mobile).

Because this hook does not use a portal, dropdowns built with it (Header language selector, "We Care" popover, mobile menu) remain at their natural DOM depth for `.dark` class inheritance via CSS descendant selectors.

### Portal architecture implication for dark mode
All portal-based overlays render into `document.body`, which is itself always a descendant of `<html>`. **A `dark` class applied to `<html>` (not `<body>`) will still cascade correctly into every portaled surface** — there is no architectural blocker here, provided the implementation follows the standard convention of toggling the class on `<html>`.

**Deliverable — explicit list of overlay surfaces requiring separate dark-mode verification:**
1. `src/components/ui/Dialog.tsx` (portal)
2. `src/components/ui/Dropdown.tsx` (portal)
3. `src/components/layout/HeaderActions.tsx` — cart/wishlist flyouts (portal, 2 instances)
4. `src/components/layout/NotificationBell.tsx` (portal)
5. `src/components/shop/StickyShopCategoryNav.tsx` (portal)
6. `src/components/shop/HowOthersAreWearingIt.tsx` (portal)
7. `src/components/layout/Header.tsx` — language selector (inline, `fixed`)
8. `src/components/layout/Header.tsx` — "We Care" dropdown (inline, `fixed`)
9. `src/components/layout/Header.tsx` — mobile hamburger menu (inline, `fixed`)
10. `src/components/chat/ChatFAB.tsx` (inline, `fixed`)
11. All admin form modals under `src/components/admin/*.tsx` — inconsistent implementation, each needs individual verification
12. `sonner` `<Toaster richColors ... />` in `src/app/layout.tsx` — third-party color scheme, verify independently

---

## PART 4 — Architecture for Covering Both Storefront and Admin

### Route-group structure
```
src/app/
├── layout.tsx                  ← ROOT layout, renders <html>/<body> (only place <html> exists)
├── globals.css
├── admin/login/page.tsx        ← standalone, outside the (admin) group, still under root layout
├── game-day-guide/page.tsx     ← standalone, outside any group
├── (admin)/
│   ├── layout.tsx              ← nested layout, session-gated, no own <html>/<body>
│   └── admin/  (products/, categories/, players/, styles/, brands/, holds/,
│                promotions/, pos-keys/, pos-events/, pos-simulator/, admins/,
│                audit-log/, settings/, analytics/, reports/, history/,
│                notifications/, game-days/, gallery/, reviews/, hero-media/,
│                hold-settings/, customer-style-submissions/, unauthorized/)
├── (public)/  (shop/, cart/, players/, brands/, gallery/, about/, about-us/,
│               shop-by-style/, size-chart/, account/, my-holds/, policy/,
│               terms/, privacy/, returns/, style-submission-policy/)
└── (print)/                    ← print-specific route group (likely needs light-mode exclusion)
```

### Root layout — `src/app/layout.tsx` (quoted)
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(display.variable, inter.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {process.env.NODE_ENV !== 'production' && (
          <script dangerouslySetInnerHTML={{ __html: `...dev SW cleanup...` }} />
        )}
      </head>
      <body className="font-sans bg-jays-ice text-gray-900 antialiased">
        <DevServiceWorkerCleanup />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
```

**`<html>` is rendered in exactly one place: `src/app/layout.tsx`.** Confirmed by reading the admin route group's layout below — it does not render its own `<html>`/`<body>`, only nested `<div>` markup. There is no conflicting nested `<html>` anywhere in the app.

### Admin layout — `src/app/(admin)/layout.tsx` (quoted)
```tsx
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  return (
    <AdminSessionProvider session={session}>
      <DataProvider>
        <AdminInactivityGuard>
          <div className="h-screen flex bg-jays-ice overflow-hidden">
            <AdminSidebar />
            <div className="flex-1 min-w-0 overflow-y-auto h-full">
              <main className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-14 lg:pt-8">
                <AdminUserProfile />
                <div className="max-w-6xl mx-auto">{children}</div>
              </main>
            </div>
          </div>
        </AdminInactivityGuard>
      </DataProvider>
    </AdminSessionProvider>
  )
}
```
A Server Component that wraps `children` in a plain `<div>` — no `<html>`/`<body>` — and is composed automatically inside the root layout by Next.js App Router.

### Exact injection points
1. **`src/app/layout.tsx`, `<head>`** — add a synchronous anti-FOUC inline `<script>` (alongside the existing dev-only SW-cleanup script, which already demonstrates the "runs before hydration" pattern) that reads the stored preference and sets `document.documentElement.classList` **before paint**.
2. **`src/app/layout.tsx`, inside `<body>`** — wrap `{children}` in a client-side theme provider (e.g. `next-themes`'s `<ThemeProvider attribute="class">`, or a small custom equivalent given the codebase currently has zero third-party theme libraries).

**No separate injection is needed for the admin route group.** Because `(admin)/layout.tsx` nests inside the root layout and never renders its own `<html>`, a theme class on `<html>` in the root layout automatically cascades to every admin page and every admin modal (including portaled ones, since `document.body` is a child of the themed `<html>`), as well as every storefront page. This is a clean, single-injection-point architecture — one of the few pieces of good news in this audit.

**Caveat:** `src/app/admin/login/page.tsx` sits outside the `(admin)` group but still nests under the same root layout, so it is equally covered. The `(print)` route group was not read in full but its existence as a separate group suggests print-specific layout requirements — it should likely be **excluded** from dark mode (print output should generally stay light-on-white regardless of the user's UI preference), and this exclusion needs explicit handling (e.g. a `not-print:` scoping or a route-level override) rather than being assumed automatic.

### Persistence convention (existing, to be mirrored)
`src/lib/i18n/LanguageContext.tsx`:
```ts
const STORAGE_KEY = 'jays-shop-locale'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && (stored === 'en' || stored === 'fr' || stored === 'es')) {
      setLocaleState(stored)
    }
  }, [])
  function setLocale(next: Locale) {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }
  // ...
}
```
This establishes the `jays-shop-<feature>` localStorage naming convention a theme key should follow (e.g. `jays-shop-theme`). **Important divergence:** this locale pattern reads `localStorage` inside a post-mount `useEffect`, which is fine for locale (no visible "flash" of the wrong language) but would cause a visible flash-of-wrong-theme for dark mode if copied as-is. Theme persistence needs the synchronous inline-`<script>` technique in `<head>` instead — the codebase already has precedent for a synchronous pre-hydration script (the dev-only SW cleanup script), so this is a known and available pattern, just not yet applied to theming.

### Recommendation: one preference or two?
**Separate preferences for admin vs. storefront**, keyed distinctly (e.g. `jays-shop-theme-admin` and `jays-shop-theme-storefront`, or a single key with a per-surface override). Reasoning:
- An admin/staff member may work at night and want a dark admin UI without affecting the customer-facing storefront view they use for live merchandising checks (product photography, banner contrast, promo styling all need to be judged in the theme customers actually see).
- Admin and storefront are functionally different audiences (internal staff vs. paying customers) with different session lifetimes and devices; coupling their preference via a single shared key creates surprising cross-surface side effects (e.g. toggling dark mode while reviewing a product listing in the admin preview panel could unexpectedly change a separate customer-facing tab if state is shared via `localStorage` events).
- This mirrors the existing architectural instinct in the codebase to keep admin and storefront concerns separated (separate route groups, separate layouts, separate session providers).

---

## PART 5 — Risk Register

### Off-limits hero files — confirmed navy-locked pattern
| File | `bg-jays-navy` | `text-white` | gradient | inline hex |
|---|---|---|---|---|
| `src/components/shop/HeroSlideshow.tsx` | 2 (comments only) | multiple (`text-white/40`, `text-white/70` nav arrows) | `bg-gradient-to-t from-jays-navy/80 via-jays-navy/25 to-jays-navy/10` | 0 |
| `src/lib/hero/getHeroSlides.ts` | 0 | — | — | — |
| `src/lib/hero/getBlurDataURL.ts` | 1 (comment re: "solid `bg-jays-navy` flash on first paint") | — | — | — |
| `src/lib/hero/heroFallbackStyle.ts` | 2 (comments) | — | — | — |
| `src/components/home/HomeHero.tsx` | 1 (section root) | 1 (`<h1>`) | comment reference | 0 |
| `src/components/shop/ShopHero.tsx` | 1 (section root) | present per broader search | comment reference | 0 |
| `src/components/styles/StylesHero.tsx` | 1 (section root) | 1 (`<h1>`) | `bg-gradient-to-t from-jays-navy/85 via-jays-navy/30 to-jays-navy/10` | 0 |
| `src/components/gallery/GalleryHero.tsx` | 1 (section root) | — | — | 0 |
| `src/components/players/PlayersHero.tsx` | 1 (section root) | 3 (`text-white/80`, `text-white`, hover `text-white`) | — | 0 |

All five hero components share an identical structural pattern: `overflow-hidden bg-jays-navy` as a solid fallback/first-paint background, a `bg-gradient-to-t from-jays-navy/NN ...` scrim over the hero image, and `text-white` headline/caption text. This is deliberate and documented (extensive comments in `HeroSlideshow.tsx`, `getBlurDataURL.ts`, `heroFallbackStyle.ts`) to avoid a flash-of-unstyled-navy before the hero image decodes.

**Impact of dark mode on these files: none, if left untouched.** They are already navy background + white text regardless of site theme — a self-contained, CLS-sensitive visual subsystem. Dark mode can be delivered **without touching any of the 8 off-limits files** (5 hero components + `HeroSlideshow.tsx` + 2 support libs); they will look correct (navy) in both light and dark mode by construction.

### Non-hero surfaces assuming a navy background (real risk)
Intersecting the `text-white` file set (102) with the `navy`-referencing file set (~125), excluding the off-limits hero files, surfaces these **true risk items** — full-bleed sections that assume an ambient navy background rather than self-contained navy buttons/chips:
- `src/components/layout/Header.tsx` — sticky header itself is `bg-jays-navy text-white`; the "We Care" dropdown's header strip uses `bg-gradient-to-r from-jays-navy to-jays-royal` + `text-white`. (Likely intentional to keep navy in both themes, similar to hero — needs an explicit decision.)
- `src/app/(public)/about/page.tsx` and its duplicate `about-us/page.tsx` — multiple full-bleed `<section className="relative bg-jays-navy text-white ...">` marketing sections.
- `src/components/holds/ReceiptCard.tsx` — `min-h-screen bg-jays-navy` full-page wrapper + `bg-jays-navy ... text-white` header card.
- `src/components/holds/ScanActionBanner.tsx` — `sticky top-0 z-50 bg-jays-navy border-b-2 border-jays-red` staff-facing banner.
- `src/app/admin/login/page.tsx` — `min-h-screen bg-jays-navy` full-page login background.
- `src/components/chat/ChatFAB.tsx` — `bg-jays-navy text-white` chat header bar; FAB button `bg-jays-royal ... hover:bg-jays-navy`.
- `src/app/(admin)/admin/unauthorized/page.tsx` — `bg-jays-navy` button with `text-white`.

The remaining large share of `text-white`/`navy` co-occurrences are self-contained button/badge pairs (background and text always travel together as one unit) spread across nearly every admin CRUD page and the shared `button.tsx` — these are **not at risk**, since the color pair is opaque and internally consistent regardless of the ambient page theme.

### `bg-jays-navy` usage count
**79 distinct files.** Overwhelmingly the "primary button" background across storefront (`AddToCartButton.tsx`, `ProductReviews.tsx`, `HoldButton.tsx`, `cart/page.tsx`, `players/[slug]/page.tsx`, `my-holds/page.tsx`, `account/page.tsx`) and admin (virtually every CRUD form's submit button, active-tab state, active-pagination state). The shared `src/components/ui/button.tsx` default variant (`'bg-jays-navy text-white hover:bg-jays-royal'`) and outline variant are the root source for many, but the 79-file count also includes pages that inline the classes directly rather than using the shared `Button` component — so a fix isn't purely centralizable through one component.

### Logos / images assuming a light background
- Only one SVG exists under `public/`: `public/placeholder-product.svg` (a product-image placeholder, not a logo).
- Brand logos are **raster PNGs** referenced via `next/image`: `/brand/logo.png` (Blue Jays logo), `/brand/canada-flag.png`, `/brand/mlb-logo.png` (via `src/components/ui/MLBLogo.tsx`).
- `MLBLogo.tsx` is a trivial `next/image` wrapper with no hardcoded fill/text colors; opacity is applied by the caller (`Header.tsx`: `opacity-80`).
- Because these are raster PNGs (not inline SVG with hardcoded fills), they cannot "vanish" the way a dark-colored inline SVG wordmark would on a dark background — but if any logo asset has a transparent background and was designed assuming light surrounding chrome, contrast could suffer on dark surfaces. **This is an asset-level (pixel content) risk that cannot be verified via source-code grep** and would need visual inspection, which is outside this read-only code audit's scope.
- No dedicated `Logo.tsx` component with hardcoded inline-SVG fill colors was found.

### Third-party embeds / iframes
**Zero.** Both `<iframe` and its HTML-entity-escaped form returned no matches anywhere in `src/`. There is no embedded map, payment widget, or video iframe in the app — this eliminates an entire category of "can't be themed" third-party content risk.

### Additional risk surfaced during the census (not explicitly requested, but material)
Two files already contain **orphaned `dark:` Tailwind variant classes** from an apparent earlier, incomplete dark-mode attempt: `src/app/(admin)/admin/admins/page.tsx` and `src/app/(admin)/admin/audit-log/page.tsx` (e.g. `dark:bg-slate-900`, `dark:border-gray-700`, `dark:bg-slate-800`). Since no `.dark {}` CSS block or toggle mechanism exists yet, these are currently dead code — but the moment a `dark` class is introduced anywhere, these two admin pages will render differently (partially dark) from the other ~150 affected files until the rest of the codebase catches up. This should be reconciled (either removed or used as the starting reference) as part of any dark-mode work.

### `(print)` route group
Not read in full during this audit, but its existence as a separate route group is a flag: print stylesheets conventionally need to stay light-on-white regardless of the user's on-screen theme preference. A dark-mode rollout must explicitly decide how `(print)` routes interact with the `dark` class (most likely: force-exclude via a `print:` override or by never rendering the print routes inside the themed shell).

---

## PART 6 — Verdict and Scope Options

### Verdict: **(B) — Colours are hardcoded.**

Although Tailwind's `darkMode: ['class']` is configured and a full shadcn-style CSS variable *scaffold* exists (18 tokens), **zero `.dark` values were ever authored**, and semantic tokens are used in only a handful of places (`border-border` in 39 files, `bg-card` essentially only inside its own primitive). The other ~150–160 files rely on hardcoded literal Tailwind utilities (`bg-white`, `text-gray-*`, `bg-jays-navy`, etc.). This is **not** a "flip a switch" toggle — it is a genuine design-token migration touching roughly half the codebase, spanning both storefront and admin, plus a fragmented modal implementation that needs surface-by-surface verification.

The one piece of good architectural news: the app has a single root layout rendering `<html>` exactly once, so the *mechanical* plumbing for a theme class to cascade everywhere (including portaled overlays) is already in place. The job is overwhelmingly about the volume of hardcoded colour classes and per-component/per-page verification, not routing or layout obstacles.

### Scope Options

**1. Full — storefront + admin, fully tokenised**
- **What it touches:** ~150–160 files; author full `.dark` values for all 18 CSS tokens; migrate hardcoded literals to semantic tokens (or add explicit `dark:` variants) across every storefront page, every admin page, all 6 portal-based overlay components, all 3 inline `fixed` dropdowns, and reconcile the two admin pages with orphaned `dark:` classes; decide the fate of the navy full-bleed sections (`Header`, `about` pages, `ReceiptCard`, `ScanActionBanner`, admin login); resolve `(print)` route exclusion; visually audit the 3 raster logo assets on dark backgrounds; independently verify `sonner`'s toast theming.
- **Effort:** Multi-week (not a single sprint) given the file count, the live commercial nature of the storefront, and the need for surface-by-surface visual QA on hero/navy sections and every admin CRUD screen.
- **Regression risk:** **High.** This is a live storefront actively taking orders; touching ~50% of the codebase's styling surface risks visual regressions in checkout, cart, product pages — all revenue-critical paths — plus the inconsistent admin modal implementations mean some modals may be missed or behave differently.
- **What the user gets:** A genuinely complete, polished dark mode across the entire product, done right.

**2. Admin-first — admin dashboard only**
- **What it touches:** The `(admin)` route group + `src/components/admin/*` (~50+ files) + the shared `ui/*` primitives also used by admin (`Dialog`, `Dropdown`, `button`, `card`, `TableWrapper`, `PaginationControls`) — but shared primitives are also used by storefront, so this "admin-first" scope still carries some storefront exposure unless those primitives are duplicated or scoped via a wrapper.
- **Effort:** Moderate — meaningfully smaller than Full, but not trivial, since the shared `ui/*` primitives are the main complexity (leverage cuts both ways).
- **Regression risk:** **Low-to-moderate.** Internal users only, zero customer-facing exposure for the admin-specific pages; residual risk only where shared primitives are touched.
- **What the user gets:** A real, usable dark admin dashboard for night-shift/staff use, without risking the customer-facing storefront. The two pages with orphaned `dark:` classes suggest this may have been the original intent of a prior partial attempt.

**3. Foundation-only — tokens + provider + toggle plumbing now, visual rollout later behind a flag**
- **What it touches:** Author `.dark` values for the 18 existing CSS tokens (small, contained change to `globals.css`); add a theme provider + anti-FOUC script at the single root-layout injection point (`src/app/layout.tsx`); wire persistence via a new `jays-shop-theme` localStorage key (or split admin/storefront keys per the Part 4 recommendation); add the toggle UI; gate any *visible* dark styling behind a feature flag so the toggle exists but does not yet change the look of hardcoded-color pages/components.
- **Effort:** Small — a few files, well-contained, no visual regression risk because nothing changes on screen yet unless explicitly enabled.
- **Regression risk:** **Very low.** No existing page's appearance changes; the only new surface is the toggle control itself and the (currently empty) `.dark` CSS values.
- **What the user gets:** All the *hard*, easy-to-get-wrong plumbing (single `<html>` injection point, anti-FOUC script, portal-safe class cascade, persisted preference, admin/storefront preference split) done correctly and shipped now, with zero risk to the live storefront. The actual visual migration (Option 1 or 2) can then proceed incrementally, page-by-page, behind the flag, without a single big-bang release.

### Recommendation

**Start with Option 3 (Foundation-only), then follow with Option 2 (Admin-first)** as the first real visual rollout once the foundation is proven stable. Reasoning:
- The foundation work is cheap, safe, and removes all the architectural guesswork (this audit already resolved the hardest question — yes, a single `<html>`-level class will correctly cascade to every portal).
- Admin-first gives the user a genuinely useful, low-risk win (night-shift staff get a dark dashboard) while deferring the highest-risk, highest-effort piece — the customer-facing storefront, including the navy hero subsystem and revenue-critical cart/checkout pages — until there's appetite for a proper multi-week, carefully QA'd migration.
- Full should not be scoped as a single project; if the user wants it eventually, it should be planned as an incremental, page-by-page migration built on top of the Option 3 foundation, not a single large PR against a live commercial storefront.

---

## Appendix — Hard Numbers Reference

| Metric | Value |
|---|---|
| Total `.ts`/`.tsx` files under `src/` | 313 |
| `darkMode` Tailwind setting | `['class']` (present, unused) |
| `.dark {}` CSS blocks defined | 0 |
| CSS colour tokens in `:root` | 18, 0 with dark values |
| `next-themes` / theme-provider dependency | Absent |
| Files with orphaned `dark:` variants (incomplete prior attempt) | 2 |
| Files using `bg-white` | 99 |
| Files using `text-white` | 102 |
| Files using `bg-jays-navy` | 79 |
| Files using `border-border` (semantic) | 39 |
| Files using `bg-background` / `text-foreground` at JSX level | 0 |
| Estimated union of files needing modification for full dark mode | ~150–160 (≈50% of codebase) |
| Off-limits hero files (confirmed navy-locked, self-contained) | 8 |
| Portal-based overlay components (`createPortal` → `document.body`) | 6 |
| Inline/`fixed`-positioned (non-portal) dropdowns | 3 |
| `<html>` render locations | 1 (root layout only) |
| `<iframe>` usages | 0 |
| Logo/SVG assets | 1 SVG (non-logo placeholder) + 3 raster PNG logos |
