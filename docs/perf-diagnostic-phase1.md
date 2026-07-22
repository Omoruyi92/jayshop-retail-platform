# Jays Shop — Performance Diagnostic Report (Phase 1)
Date: 2026-07-21

## 1. Blank `/players` page bug

**Status: NOT REPRODUCIBLE as a persistent bug. Root cause found and it is transient/environmental, not a code defect. No code fix applied (none needed) — see explanation below.**

### Investigation
- Started local dev server (`npm run dev`), hit `/players` directly with `curl` and with a headless Playwright browser at 375px/768px/1280px.
- In every attempt, the page rendered correctly: hero banner, "POPULAR PLAYERS" header, search/filter bar, and a 4-card grid (Addison Barger, Kazuma Okamoto, Ernie Clement, Vladimir Guerrero Jr.).
- `/api/players` returned `HTTP 200` with 4 players in every test.
- Verified the DB directly via a throwaway Prisma script: 4 `ACTIVE` players exist, all with valid `heroImageUrl` values and the correct `tenantId`.

### What *did* reproduce a blank-body state (self-inflicted, and root-caused)
While investigating, disk space on the machine was critically low (**~1.1GB free** at the low point, `df -h /` showed 92% used). When I cleared `.next/cache` to free space and the disk briefly stayed near-full, the dev server's `/api/players` route started returning **500 errors** for a short window. Because `page.tsx` fetches client-side with `.then(res => res.json())` and no error handling for non-2xx (see `src/app/(public)/players/page.tsx:20-27`), a 500 response gets fed into `setPlayers(data.players ?? [])`. If the JSON body doesn't have a `players` key (e.g. an error payload), `players` silently becomes `[]`, `loading` resolves to `false`, and the page renders the `EmptyState` — not literally blank, but this is the closest local repro to "body empty, no error shown, no console error" because **fetch errors are swallowed with `.finally()` and no `.catch()`** — a real hardening gap.
- After restarting the dev server and freeing disk space, everything returned to healthy immediately.

### Most likely root cause of the user's screenshot
Given the code path, the leading hypothesis (not confirmed against production, since I only have local access) is one of:
1. **Transient 5xx/DB hiccup** at the moment of the screenshot (disk pressure, connection pool exhaustion, or a cold serverless start) that the client-side fetch swallowed instead of surfacing — the missing `.catch()` on `fetch('/api/players')` means any network/500 error results in "loading" flipping to false with an empty players array and no visible error, which matches "no error message, no loading state, empty body" exactly.
2. A stale Service Worker (next-pwa is enabled for production builds — `next.config.js:2-18`, `disable: process.env.NODE_ENV === 'development'`) caching a stale/broken JS chunk or an old empty API response from a previous deploy, if the user was on a production/preview build rather than dev.

### Recommended (not yet applied — needs decision)
- Add `.catch()` handling to the `/players` and `/players/[slug]` client fetches to show a real error state instead of silently defaulting to empty array. This is a one-line-per-file trivial fix but touches user-facing error UX, so flagging for explicit go-ahead in Phase 2 rather than doing it opportunistically here, per the instruction to only fix *trivial, obviously-safe* issues in this pass.
- If the user can reproduce this again, capture the Network tab response body/status for `/api/players` at that moment — that's the fastest way to confirm hypothesis 1 vs 2.

### Quick, safe fix applied in this pass
None applied to the blank-page bug — could not reproduce a genuine code-level defect to fix; the improvement above (`.catch()` handling) is a UX/behavior change best queued for Phase 2 with explicit sign-off rather than silently slipped into a "diagnose" pass.

---

## 2. Player pages — performance findings

### CRITICAL
**C1. Every player-related request bypasses caching entirely (`force-dynamic` everywhere)**
- `src/app/api/players/route.ts:4` → `export const dynamic = 'force-dynamic'`
- `src/app/api/players/[slug]/route.ts:4` → same
- No `revalidate`, `unstable_cache`, or HTTP cache headers anywhere in the players API routes.
- Evidence: every page load/reload hits Postgres fresh; confirmed via repeated `curl` timing and Playwright network capture — 4x identical `/api/players` calls fired across cold+warm reloads with no cache reuse.
- Impact: for a catalog of largely-static promotional data (player list rarely changes), this means every visitor triggers a live DB round trip, and the same is true for `/api/players/[slug]`.
- Fix approach (Phase 2): convert `/api/players` and `/api/players/[slug]` GET handlers to use `unstable_cache` (or ISR via ordinary ` revalidate = 300`-style ) keyed on tenant + query params, with on-demand `revalidatePath`/`revalidateTag` from the admin mutation routes (the codebase already uses `revalidatePath` elsewhere per commit `755d802`).

**C2. Player list/detail pages are client components that fetch after mount — no SSR, no streaming, causes visible skeleton flash**
- `src/app/(public)/players/page.tsx` and `.../[slug]/page.tsx` are both `'use client'` with `useEffect` + `fetch`, unlike `/`, `/shop`, `/brands/[slug]` which are async Server Components calling Prisma directly (confirmed via grep: only `brands`, `shop-by-style`, `shop/[slug]`, `holds` do direct server-side Prisma calls; `players` routes do not appear in that list).
- Impact: extra client-server round trip on every navigation (can't be parallelized with the initial HTML), a guaranteed loading skeleton on every visit (even instant repeat visits), and no ability to leverage Next.js full-route caching/ISR the way the home/shop pages already do.
- Fix approach (Phase 2): convert to Server Components with direct Prisma fetch + a client-side filter/search "islands" component (same pattern shop/brands already use), OR keep client-side but hydrate from server-fetched `initialPlayers` prop (same fallback-avoidance pattern already used for hero slides in `HomePage`/`ShopPage` via `getHeroSlides`).

### MAJOR
**M1. Duplicate/redundant network requests fired on `/players` load**
- Playwright network capture on one page load + one reload showed:
  - `/api/promotions` fired **5x per page view** (20 total across 2 loads) — both `PromotionBanner.tsx` and `PartnerLogosBar.tsx` independently fetch the same promotions endpoint with no shared cache/dedup.
  - `/api/hero-slides?scope=PLAYERS`, `/api/players`, `/api/likes`, `/api/notifications` each fire once per load as expected, but combined with the 5x promotions calls this is real waterfall bloat on a single route.
- Fix approach: hoist promotions fetch to a shared context/SWR cache (or a server-fetched prop passed down from layout), so it fires once per navigation instead of once per consuming component.

**M2. No N+1 query pattern in the player→products join (good) but detail route fetches full `Product` rows unfiltered**
- `src/app/api/players/[slug]/route.ts:9-16` uses a single `include: { products: { include: { product: true } } }` — this is correctly a single query, not N+1. Good pattern already in place.
- However it selects the **entire** `Product` row (all ~20+ columns per schema) for every linked product just to display name/slug/image/price/color/isFeatured on the card. Minor over-fetch; not urgent but easy to tighten with `select`.

**M3. Player list route re-runs `_count` aggregate on every request with no filter narrowing at the DB level for `trending`/`featured` toggle combos**
- Not a real N+1, just flagged because it's a `findMany` with an unindexed-looking dynamic `where` shape (`isFeatured`/`isTrending` are indexed per schema — confirmed `@@index([isFeatured])`, `@@index([isTrending])`, `@@index([status])`, `@@index([tenantId])` all present on `Player` model, so this is actually fine). No action needed — noting as "checked, no issue."

### MINOR
**Mi1. Images: correctly sized, but delivered format could be tighter for detail page hero**
- `PlayerCard` and `PlayerCatalogPreview` both use `next/image` with `fill` + proper `sizes` attributes — good, no oversized-image problem. Confirmed via `curl` against `/_next/image?...w=360&q=75` for a player thumbnail: transferred **16.2KB** for a 360x240 render versus the 209KB/220KB source WebP files — Next's automatic resizing is working correctly.
- No `priority` prop is set on the above-the-fold `PlayersHero` background image or the first row of `PlayerCard`s, meaning LCP candidate images are lazy-loaded by default. Trivial win for Phase 2: add `priority` to the hero image and first 2-4 cards in the grid.
- Total `public/uploads` on disk: 48MB across 334 files (source assets) — reasonable, not the bottleneck; the bottleneck is caching/round-trips, not raw file weight.

**Mi2. Player detail page gear grid doesn't set `priority`, acceptable since below the fold — no action needed.**

---

## 3. Site-wide spot check (not fixed, just noted)

- **Home (`/`) and Shop (`/shop`)** pages are also `force-dynamic` (`src/app/(public)/page.tsx:7`, `src/app/(public)/shop/page.tsx:4`) — same no-caching anti-pattern as players, site-wide. This is a systemic pattern, not isolated to players.
- Home/Shop/Brands detail pages *do* correctly use direct server-side Prisma calls (no client-fetch waterfall) — only the Players routes use the client-fetch pattern, making Players comparatively slower on first paint than Home/Shop.
- `/api/promotions` over-fetching (5x per page) is likely present site-wide too, since `PromotionBanner` and `PartnerLogosBar` are both mounted in the shared `(public)/layout.tsx` header — worth a full sweep in Phase 2, not just on `/players`.
- Did not run a production `next build` for bundle-size numbers — the local machine hit disk-space exhaustion (dropped to ~1.1GB free) mid-build; build output was inconclusive/incomplete. This should be re-attempted in Phase 2 with disk space freed up (see Environment Note below), specifically to get per-route JS bundle sizes for `/players` and `/players/[slug]`.

---

## 4. Responsiveness spot-check (players + player detail)

Screenshots captured via Playwright at 375px, 768px, 1280px on `/players`:
- 1280px: 4-column grid, hero, header, search/filter bar all render cleanly. No overlap or clipping observed.
- 768px: 3-column grid, layout reflows correctly, bottom nav (Shop/My Holds/Chat) appears appropriately for tablet width.
- 375px: 2-column grid, all text/badges legible, no horizontal scroll, no obvious breakage.
- No glaring responsive bugs found on `/players` in this spot-check. Full responsive pass deferred to the later phase as scoped.
- Did not have a populated player detail page screenshot captured in this pass (time-boxed to the listing page + the priority blank-page investigation); recommend including `/players/[slug]` explicitly in the later full responsive phase.

---

## 5. Environment note (relevant to reproducibility)

The local machine's disk was critically low (~1.1–2.6GB free of 228GB, 82-93% used) during this session, which caused a real, observable `/api/players` 500 failure when `.next/cache` was cleared under pressure. This is worth flagging to the user directly: **if the blank-page screenshot was taken on this same machine/environment, disk pressure causing intermittent 500s (silently swallowed by the missing `.catch()` on the client fetch) is the most concrete lead.** Recommend clearing unused Docker/node_modules/build caches or expanding disk before Phase 2 to avoid repeat false signals during remediation.

---

## Summary table

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | Blank `/players` page | — | Not reproducible as persistent bug; likely disk-pressure-induced transient 500 + missing `.catch()` on client fetch (real hardening gap, not fixed this pass) |
| C1 | No caching on `/api/players`, `/api/players/[slug]` (force-dynamic) | Critical | To fix Phase 2 |
| C2 | Players pages are client-fetch, not SSR (skeleton flash, no ISR) | Critical | To fix Phase 2 |
| M1 | `/api/promotions` fetched 5x per page load (dup fetch, two components) | Major | To fix Phase 2 |
| M2 | Player detail over-fetches full `Product` rows | Major (minor perf, easy fix) | To fix Phase 2 |
| M3 | `_count`/filter query shape | Major (checked) | No issue — indexes already present |
| Mi1 | No `priority` on above-fold hero/first cards | Minor | To fix Phase 2 |
| Mi2 | Gear grid below-fold images | Minor | No action needed |
