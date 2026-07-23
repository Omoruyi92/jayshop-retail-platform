# Jays Shop — Site-wide Layout-Shift / Flicker Audit

**Date:** 2026-07-23
**Target:** https://jayshop-retail-platform.vercel.app (production)
**Method:** Puppeteer + Chrome DevTools headless, `PerformanceObserver({type:'layout-shift', buffered:true})` (the real Layout Instability API — same source Lighthouse/CrUX use), injected via `page.evaluateOnNewDocument` before navigation so it captures shifts from first paint through 5s post-load (covers hydration + async fetches). Full per-shift entries (moved element, previous/current rect, timestamp) captured, not just the aggregate score.

Tooling: `/tmp/cls-audit/measure.js` (single page/viewport CLS capture + screenshot), `/tmp/cls-audit/run-all.js` (35-combination batch runner), `/tmp/cls-audit/login.js` (admin cookie capture). Raw data: `/tmp/cls-audit/all-results.json`. Screenshots: `/tmp/cls-audit/*.png`.

---

## 1. Measured CLS scores (cold load, real production)

| Page | 375px | 768px | 1024px | 1280px | 1920px |
|---|---|---|---|---|---|
| Home (`/`) | 0.0925 | 0.0560 | 0.0349 | 0.0278 | 0.0189 |
| Shop (`/shop`) | 0.0968 | 0.1319 | **0.2355** | 0.0375 | 0.1420 |
| PDP — hoodie | **0.9599** | 0.2330 | 0.3520 | **0.9972** | 0.7102 |
| PDP — jersey | 0.2185 | **0.9974** | **0.9872** | 0.1545 | 0.7306 |
| PDP — hat | **0.9599** | **0.9974** | 0.1721 | **0.9972** | 0.7558 |
| Cart (`/cart`) | 0.0924 | 0.0560 | 0.0349 | 0.0278 | 0.0083 |
| Admin dashboard (`/admin`, logged in) | 0.0000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |

**Google "Good" threshold is CLS ≤ 0.1, "Poor" is > 0.25.** Every PDP/viewport combination tested lands solidly in the "Poor" bucket, several essentially maxing out the metric (values > 0.9). Shop and Home are borderline-to-poor depending on viewport. Cart mirrors Home (same layout shell, empty-cart state). **Admin dashboard is clean — 0.0000 CLS at all 5 viewports**, confirmed via real login with the provided credentials.

### Multi-reload determinism check (manual spot check, same URL+viewport, back-to-back)
- **Home @ 1280px, 3 reloads:** 0.0278 / 0.0278 / 0.0278 — perfectly deterministic.
- **PDP (hoodie) @ 1280px, 4 reloads:** 0.1545 / 0.3295 / 0.3295 / **1.0069** — highly non-deterministic, same URL/viewport, pure network-timing race between three independent client-side fetches (promotions, category tree, reviews) resolving in different orders relative to first paint. This means the CLS a real user experiences varies shift to shift and is materially worse under slow/variable network conditions.

---

## 2. Root-cause categories (each verified against this codebase, not assumed)

### A. **[SITE-WIDE, HIGHEST IMPACT] `PromotionBanner` renders `null` then pops in above the sticky header**
- **File:** `src/components/layout/PromotionBanner.tsx` (mounted in `src/app/(public)/layout.tsx:28`, before `<Header/>`)
- **Category:** Client-only conditional rendering (`useEffect`-gated content) with no space reservation.
- **Mechanism:** `const [loaded, setLoaded] = useState(false)` → returns `null` until a `useEffect` resolves `localStorage` dismissal state (line 31: `if (!loaded || visible.length === 0) return null`). It sits in normal document flow, in front of `Header`/`SubNavBar`/`main`. When an active, non-dismissed promotion exists, this component inserts a real `px-8 py-2` block *after* first paint, pushing every element below it (including the sticky header itself) down by its own height.
- **Evidence:** every single captured shift entry across Home/Shop/PDP/Cart names `main.flex-1.pb-24.sm:pb-0` as a moved element with `y` increasing (e.g. Home @1280: `y:101→141`; PDP @1280: `y:101→141` compounded with more). This is the layout-tree parent of everything `PublicLayout` renders, so its displacement is the *root* signal underlying nearly every other shift recorded.
- **Est. CLS contribution:** single largest source, roughly 0.02–0.03 alone on pages where no other shift compounds with it (this matches Home's stable, deterministic 0.0278 at 1280px, which has no other active client-fetched content).

### B. **[SITE-WIDE, COMPOUNDING] `Header`/`SubNavBar` CSS-variable height cascade**
- **Files:** `src/components/layout/Header.tsx:57-67`, `src/components/layout/SubNavBar.tsx:38-48`
- **Category:** Client-only conditional rendering + dynamic `ResizeObserver`-driven CSS custom properties, compounding across two independent layers.
- **Mechanism:** `Header` measures its own `offsetHeight` via `useLayoutEffect` + `ResizeObserver` and writes `--header-height` to `document.documentElement.style`. `SubNavBar` is `position: sticky; top: var(--header-height, 3.5rem)` and does the *same* thing for `--subnav-height`. Both variables are consumed downstream: `StickyShopCategoryNav` (`top: calc(var(--header-height))`), PDP page wrapper (`pt-[var(--subnav-height,2.75rem)]`), `GalleryPageClient`. Header's real rendered height changes whenever its child `PartnerLogosBar`/`LocationBadge` (async `usePromotions()` fetch, see finding D) resolves and toggles the `hasPromotions` branch, or whenever finding A's banner pops in above it. Each resize event re-fires the CSS var update, re-positioning every sticky element and the padded content beneath it — a second, independent wave of layout shift on top of finding A.
- **Evidence:** `main` element rect shows *two separate* `y` jumps at different `startTime`s within the same page load in several traces (e.g. Shop @1024px: first shift `y:56→90` on the fixed category-pill bar at t=243ms, second shift `y:135→177` on `main` at t=341ms) — consistent with two independent resize events, not one.
- **Est. CLS contribution:** 0.03–0.25+ depending on viewport (worst on 1024px where `PartnerLogosBar`'s `xl:` breakpoint visibility changes the Header's child layout the most).

### C. **[PDP, HIGH IMPACT] `ProductReviews` loading skeleton doesn't match real content height**
- **File:** `src/components/shop/ProductReviews.tsx:121-130` (skeleton) vs. `:132-226` (real content)
- **Category:** Skeleton-to-real-content swap where skeleton doesn't reserve the same space as final content.
- **Mechanism:** While `loading` is true, renders a fixed `h-4 + h-20` skeleton block (~108px, confirmed by the captured `previousRect.height: 108`). Real content height depends entirely on review count (0 reviews → single `py-4` line; N reviews → N review cards). The observed trace shows this block's rect collapsing from 108px to `0×0` (fully removed from the shift-relevant area) as part of the same batch that also moves `main` — i.e., it's firing in the same async-resolution window as the header cascade, compounding the total shift.
- **Evidence:** PDP-hoodie @1280px trace: `div.flex.items-center.justify-between "Fan ReviewsWrite a Review"` — `previousRect: {y:0,height:108}` → `currentRect: {y:0,height:0,width:0}`.
- **Est. CLS contribution:** 0.05–0.15 depending on final review count for that product; compounds directly with finding B because both resolve in the same 300-500ms window post-load.

### D. **[HOME/SHOP/PDP] `StickyShopCategoryNav` renders full static category list while loading, then shrinks once real data arrives**
- **File:** `src/components/shop/StickyShopCategoryNav.tsx:91-120`, backed by `src/hooks/useCategoryTree.ts:29-39`
- **Category:** Client-only conditional rendering driven by an async fetch, with no space reservation for the narrower final state.
- **Mechanism:** `useCategoryTree()` returns `loading: categories === null`. While loading, `StickyShopCategoryNav` uses the full static `CATEGORY_SORT_ORDER` (10 entries) to build `pills`; once `/api/categories` resolves, `pills` is filtered down to `allPills.filter(p => p.value === 'All' || p.hasDropdown || p.children.length > 0)` — visibly fewer, narrower pills. The row is centered (`justify-center`), so this isn't just a width change, it's also a horizontal re-center, and (per finding B) the entire bar's vertical position is also independently shifting.
- **Evidence:** Shop @1024px trace: `div.hidden.max-w-full.items-center "AllMenWomenKidsAccessories"` — `previousRect: {x:32, width:960}` → `currentRect: {x:296.9, width:430.1}`.
- **Est. CLS contribution:** 0.02–0.08, mostly on Shop and PDP where this nav is present (Home does not render `StickyShopCategoryNav`).

### E. **[HOME, MINOR — residual] Store-hours text still produces a tiny (non-zero) shift**
- **File:** `src/components/ui/PartnerLogosBar.tsx:42-57` (`useStoreStatus`)
- **Category:** Client-only conditional rendering (timezone-safe hydration pattern, correctly implemented per the prior fix in commit `e3177db`).
- **Mechanism:** This is the component that was already fixed. The fix (render `\u00A0` placeholder, same size/position, swap text post-mount) is correctly implemented and eliminates the *visual* jump. However, because the placeholder glyph (`\u00A0`, width ≈2px) and the real text (`"Opens at 10:00 AM"`, width ≈72px) are not pixel-identical widths, the Layout Instability API still registers a technically-measurable (but visually imperceptible) shift.
- **Evidence:** every trace shows `span.text-blue-200/50.text-[8px] "Opens at 10:00 AM"` with `previousRect.width: 2.25` → `currentRect.width: 71.9`, but `value: 0.000015-0.00003` (four orders of magnitude smaller than every other finding).
- **Est. CLS contribution:** negligible (<0.0001). Flagging only for completeness since the prior task explicitly targeted this component — **this is not a regression, it's an acceptable residual of an already-shipped, effective fix.** No action needed unless the user wants literal 0.0000.

### F. **[LOW/NON-ISSUE] `RecentlyViewedPopup`, `CartContext` hydration**
- **Files:** `src/components/shop/RecentlyViewedPopup.tsx`, `src/lib/store/CartContext.tsx`
- **Category:** Client-only conditional rendering — but *not* a CLS source in practice.
- **Why not a real issue:** `RecentlyViewedPopup` is `position: fixed inset-0` (overlay), gated behind a 3s delay + `sessionStorage` check — it never participates in in-flow reflow and, in this fresh-session audit, never fired within the 5s capture window. `CartContext` initializes `items: []` synchronously and only populates from `localStorage` in `useEffect`; for a fresh/anonymous session (which is what real first-time visitors and this audit both represent) the SSR-empty and post-hydration-empty states render identically, so no shift occurs (confirmed: Cart page's only shifts are findings A/B, not cart-content-specific).

---

## 3. Admin dashboard — confirmed clean

Logged in with `admin@jays.shop` / the provided password, captured cookies, ran the full 5-viewport matrix against `/admin`: **0.0000 CLS at every viewport**, `domContentLoaded`/`load` both firing at ~183ms with no subsequent shift events in the following 5s window. No admin-specific findings to report. (Note: `/admin/reports`, which contains the chart components, was intentionally **not** touched or measured in depth per the collision-avoidance flag below.)

---

## 4. Collision flags

- **Hero Banner / hero-slideshow feature:** `src/components/shop/HeroSlideshow.tsx` and `src/components/home/HomeHero.tsx` were inspected. The slideshow also has a `loaded`-gated `null` render, but it lives inside a parent `<section>` with a fixed `h-[50vh] max-h-[500px] min-h-[360px]`, so — unlike findings A-D — **it does not appear in any captured shift trace**; its late content pop-in happens within already-reserved space. No overlap with the separate in-progress hero-slideshow skill was needed for this audit's findings, but flagging explicitly since the user asked: **none of findings A-F touch `HeroSlideshow.tsx` or `HomeHero.tsx` internals.**
- **Admin dashboard charts / dashboard-fix skill:** Confirmed 0 CLS on `/admin` itself. Did not open or analyze `src/app/(admin)/admin/reports/page.tsx` (recharts-based) beyond confirming its existence via `grep_file`, to avoid collision with the separate in-progress dashboard-fix skill.

---

## 5. Proposed fix approach per category (not implemented — audit only)

| # | Category | Proposed approach |
|---|---|---|
| A | `PromotionBanner` pop-in | Reserve space unconditionally: render a fixed-height (or `min-height`) wrapper immediately (server + first client paint), matching the eventual single-promo row height, and animate/reveal content within it — mirroring the pattern already used successfully for the store-hours fix (stable placeholder, no `return null`). Alternative: move the "is there a dismissable promo to show" decision to the server (cookie-based dismissal instead of `localStorage`) so it can be resolved before first paint. |
| B | Header/SubNavBar CSS-var cascade | Two options: (1) Make `PartnerLogosBar`'s promo-marquee branch reserve a fixed height regardless of `hasPromotions` (same technique as A) so `Header`'s `offsetHeight` never actually changes post-mount, eliminating the `ResizeObserver` firing at all in the common case; (2) if height must vary, transition `--header-height` with a CSS `transition` on the consuming elements' `top`/`padding` properties so the change animates smoothly instead of jumping — reduces perceived flicker even if the CLS score itself isn't fully zero. Recommend (1) as the primary fix since it addresses root cause, not just symptom. |
| C | `ProductReviews` skeleton mismatch | Fetch review count/summary in the PDP server component (already fetching product/inventory data there) and pass an initial count as a prop, so the client component can size its skeleton/empty-state to match the real eventual layout — or simplify to a single skeleton shape that's sized for the *empty* state (most common case) and let genuine review lists (rare, 1-3 cards) grow downward, which is far less perceptible than the header-adjacent shift. |
| D | `StickyShopCategoryNav` pill-count swap | Fetch categories server-side (the page/layout already has server access to Prisma) and pass as an initial prop to skip the client-side `loading` state entirely, matching the same SSR pattern already used for `sizeAvailability`/`locationInventory` on the PDP page. If a client fetch must remain for freshness, keep the *filtered* pill list as the loading placeholder (reserve the narrower width) rather than the full static list. |
| E | Residual store-hours sub-pixel shift | Optional: swap the `\u00A0` placeholder for a text string pre-sized to match the longest realistic value (e.g. `"Opens at 10:00 AM"` rendered with `visibility: hidden` to reserve exact width) instead of a single non-breaking space. Cosmetic only — current CLS contribution is already negligible. |
| F | RecentlyViewedPopup / CartContext | No fix needed; already structurally safe (fixed-position overlay; empty-state SSR/CSR parity). |

---

## 6. Screenshots and raw data

- Raw JSON (all 35 measurements + full shift entries): `/tmp/cls-audit/all-results.json`
- Per-page/viewport screenshots: `/tmp/cls-audit/*.png` (35 files)
- Reusable measurement tooling: `/tmp/cls-audit/measure.js`, `/tmp/cls-audit/run-all.js`, `/tmp/cls-audit/login.js`
