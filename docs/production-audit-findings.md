# Jays Shop — Production Audit Findings (Phase 1: Diagnostic Investigation)

**Date:** 2026-07-23
**Repo commit audited:** `d1629fa` (2026-07-22)
**Production URL:** https://jayshop-retail-platform.vercel.app
**Method:** Code review (`grep`/`file_read`/`git log`) + live production inspection via a headless Chrome instance driven by `puppeteer-core` (console/pageerror/network listeners, viewport screenshots at 375/768/1024/1280/1920px) + `curl` header inspection of HTML, static chunks, and Vercel Blob/Unsplash image URLs.

> Scope note: this is investigation only. No large speculative fixes were shipped. One trivial, safe observation is called out in Area 1 but was **not** applied — it's flagged for the next phase.

---

## Summary Table

| # | Area | Root cause status | Severity |
|---|------|-------------------|----------|
| 1 | Hydration/rendering mismatches | **Confirmed** — reproduced live, root cause identified | High |
| 2 | Responsiveness regressions | No new issues found beyond `bc14fba` | Low (nothing to fix) |
| 3 | Promotions Marquee stutter/jump/reset | **Not reproducible** — animation is smooth | Low (nothing to fix) |
| 4 | Hero banner image delivery / Nigeria failure | **Inconclusive** — no code-level cause found | Unknown |
| 5 | Static asset caching / CDN | **Confirmed working correctly** | None (no bug) |
| 6 | Default landing route | **Confirmed working correctly** | None (no bug) |

---

## 1. Hydration/Rendering Mismatches (prod-only) — CONFIRMED ROOT CAUSE

**Severity: High** (visible console errors on every page load in production; degrades to a client-side re-render, so not fatal, but indicates real state/markup divergence and hurts trust/SEO/perf).

### Evidence
- Live console capture (via `puppeteer-core` against the real prod URL) on Home, Shop, and a Product Detail page all show React's minified production hydration errors:
  - `Minified React error #418` — "Hydration failed because the initial UI does not match what was rendered on the server."
  - `Minified React error #423` — hydration error that React recovered from by re-rendering the whole tree client-side.
  - `Minified React error #425` — "Text content does not match server-rendered HTML."
  - PDP additionally showed `#329` (an error surfaced by the recovery boundary).
- Running the **identical** `puppeteer-core` script against a **local `next dev`** server produced **zero** hydration errors — confirming this is prod-only, matching the user's report exactly.
- To find the actual diverging DOM node, the SSR-only HTML (JS disabled) was diffed against the post-hydration DOM (JS enabled) text-node by text-node. The very first divergence was:
  ```
  ssr: "Open"              hyd: "Closed"
  ssr: "Closes at 5:00 PM" hyd: "Opens at 10:00 AM"
  ```
- This text comes from `LocationBadge` / `useStoreStatus()` in:
  ```10:27:src/components/ui/PartnerLogosBar.tsx
  function useStoreStatus() {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
      const id = setInterval(() => setNow(new Date()), 60_000)
      return () => clearInterval(id)
    }, [])

    const hour = now.getHours()
    const isOpen = hour >= OPEN_HOUR && hour < CLOSE_HOUR

    const statusLabel = isOpen ? 'Open' : 'Closed'
    const nextChange = isOpen
      ? `Closes at ${CLOSE_HOUR > 12 ? CLOSE_HOUR - 12 : CLOSE_HOUR}:00 PM`
      : `Opens at ${OPEN_HOUR}:00 AM`

    return { isOpen, statusLabel, nextChange }
  }
  ```
- `PartnerLogosBar`/`LocationBadge` is rendered unconditionally (no `dynamic(..., { ssr: false })` guard) inside `Header.tsx` (lines 119, 280), which mounts on **every page** — this explains why the same error signature appeared on Home, Shop, and PDP alike.

### Two compounding bugs identified

**(a) Server/client clock-skew hydration bug.** `useState(() => new Date())` runs its lazy initializer once on the server during render and again on the client during hydration. These are two different points in time. Home uses ISR:
  ```13:src/app/(public)/page.tsx
  export const revalidate = 60
  ```
  Combined with Vercel's edge cache (`x-vercel-cache: STALE` was observed on the HTML document response, confirming stale-while-revalidate is in play), the gap between "when this HTML was generated" and "when a given visitor's browser hydrates it" can be anywhere from milliseconds to **well over a minute**. Any time that gap straddles the `OPEN_HOUR` (10) or `CLOSE_HOUR` (17) boundary, the server-rendered text and the client-hydrated text literally disagree → exact match for React's "text content does not match" error. In `next dev`, SSR happens fresh on each request microseconds before hydration, so the boundary is essentially never crossed — explaining why it never reproduces locally.

**(b) Wrong timezone.** `new Date().getHours()` reads hours in the **runtime's local timezone**, not the store's timezone (Toronto / `America/Toronto`). Vercel's serverless/edge functions run in **UTC**, so server-side `isOpen` is computed against UTC hours while the client (a Toronto visitor's browser) computes it against EDT/EST. At the time of this audit (11:16 UTC ≈ 07:16 EDT), the server evaluated `hour=11` → "Open", while the client evaluated `hour=7` → "Closed" — this is a second, independent bug that guarantees a mismatch for roughly 4-5 hours of every day (the UTC offset window) regardless of ISR staleness.

### Proposed fix approach (not yet applied)
- Compute `isOpen`/store hours using an explicit `America/Toronto`-aware calculation (e.g. `Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', hour: 'numeric', hour12: false })`) instead of the ambient runtime timezone.
- Avoid using a time-derived value in the initial render output at all if it must match exactly between server and client. Options: render a stable placeholder/skeleton for the status pill on first paint, then swap to the real "Open/Closed" label inside `useEffect` after mount (this is the standard, React-recommended pattern for anything that legitimately differs between server and client — the DOM only updates post-hydration, so no mismatch is ever reported).
- Not attempted as a "trivially safe" fix here because it touches rendering behavior on every page and deserves its own focused change + verification pass, per the instruction to avoid shipping speculative fixes during investigation.

---

## 2. Responsiveness Regressions — NO NEW ISSUES FOUND

**Severity: Low** (nothing actionable found beyond what's already fixed).

### Evidence
- Live screenshots captured at 375/768/1024/1280/1920px for Home, Shop, and Cart via `puppeteer-core`, plus a programmatic overflow check (`document.documentElement.scrollWidth` vs `window.innerWidth`) at every breakpoint:
  ```
  home @ 375w: overflow=false   shop @ 375w: overflow=false   cart @ 375w: overflow=false
  home @ 768w: overflow=false   shop @ 768w: overflow=false   cart @ 768w: overflow=false
  ... (1024/1280/1920 all overflow=false)
  ```
- Visual review of the screenshots shows clean layout at all breakpoints: header/nav collapse correctly, hero banner scales, product grids reflow from 2 columns (mobile) to multi-column (desktop), FAQ/footer stack correctly.
- The prior fix in `bc14fba` (admin tablet header overlap + mobile table horizontal-scroll hint) was reviewed via `git show --stat` and is a small, targeted 2-file change (`src/app/(admin)/layout.tsx`, `src/components/ui/TableWrapper.tsx`) — did not find any regression or leftover issue from it in the code.
- **Limitation:** Admin Dashboard could not be re-verified live at all 5 breakpoints — an automated login attempt (scripted credential submission via Puppeteer) was blocked by a safety guard in this environment. Public storefront pages (Home/Shop/Cart) were fully verified; Admin was verified via **code review only** (the `bc14fba` diff is small and targeted, and no related regressions were found by reading the current `src/app/(admin)/layout.tsx`).

### Recommended next step
If admin responsiveness needs live re-verification, this should be done by a human logging in directly, or by re-running the same Puppeteer script with an explicit one-time manual approval for the login step.

---

## 3. Promotions Marquee Stutter/Jump/Reset — NOT REPRODUCIBLE

**Severity: Low** (no bug found; architecture is sound).

### Evidence
- Two marquee-style components exist in the codebase:
  - `PromoMarquee` in `src/components/ui/PartnerLogosBar.tsx` (lines 97-115) — the live promotions ticker embedded in the header.
  - `PartnerLogoMarquee.tsx` — a similar pattern for partner logos.
- Both use a pure CSS `@keyframes` animation defined in `tailwind.config.ts`:
  ```73:76:tailwind.config.ts
  'marquee': {
    '0%':   { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-50%)' },
  },
  ```
  applied as `animation: 'marquee 28s linear infinite'` (line 93) via the `animate-marquee` utility class. This is GPU-accelerated (`transform`, not `left`/`margin`) and entirely CSS-timeline-driven — it does not depend on React state, so re-renders of the parent (e.g. from `PromotionsContext` polling) cannot restart or interrupt it.
  - Content is duplicated (`<PromoStrip promotions={promotions} />` rendered twice, lines 108-110) specifically to create a seamless infinite-loop illusion at the `-50%` translate point.
- Live measurement: sampled `getComputedStyle(el).transform` on the marquee element 20 times over ~6 seconds on the production site. The horizontal offset advanced **linearly and consistently** (~66.7px/second every single sample, no resets, no jumps, `animationPlayState: "running"` throughout):
  ```
  t=...760  translateX ≈ -54.24px
  t=...063  translateX ≈ -60.30px
  ...
  t=...553  translateX ≈ -171.13px
  ```
- No stutter, jump, or reset was observed or is architecturally plausible given the implementation.

### Conclusion
This issue could not be reproduced from this environment. If the user is still observing it, it's likely either (a) a lower-end/throttled device issue (CSS transform animations can still jank under heavy main-thread contention from other scripts), (b) a specific browser/OS combination not tested here, or (c) already resolved by a prior change. Recommend asking the user for a screen recording or device/browser details if it persists, rather than guessing at a fix.

---

## 4. Hero Banner Image Delivery + Nigeria-Specific Failure — INCONCLUSIVE

**Severity: Unknown — could not be confirmed or denied from this environment.**

### What was checked
- **`next.config.js` image config:** `remotePatterns` correctly allowlists `*.public.blob.vercel-storage.com` (Vercel Blob) and `images.unsplash.com`, so there's no domain-allowlist bug causing image load failures.
- **`next/image` optimization is bypassed entirely for these images.** `HeroSlideshow.tsx` (line 101) and other admin-uploaded-media components pass `unoptimized` to every `<Image>` tag rendering a Blob-hosted asset:
  ```101:src/components/shop/HeroSlideshow.tsx
                  unoptimized
  ```
  This has been the case since the hero feature was first introduced (`git log -S"unoptimized"` → commit `15d8f2e`, "feat(hero): admin-managed home/shop slideshows..."). This is actually **evidence against** the "Vercel Image Optimization API proxy times out for certain regions" theory in the task brief — because `unoptimized` means these images are served as **raw Blob/Unsplash URLs directly to the browser**, never proxied through `/_next/image`. So if Nigerian users saw broken hero images, it was not because of the Next.js image-optimization proxy — that code path isn't in use for hero media at all.
- **No geo-blocking, country-check, or referrer/hotlink-protection logic exists anywhere in the codebase.** `grep` for `geo|country|x-vercel-ip-country|Accept-Language` across `src/` returned no matches, and `middleware.ts` contains no such logic (see Area 6 below for the full middleware review).
- **Direct header tests against the live Blob CDN** with spoofed `Accept-Language: en-NG` and a foreign `Referer` both returned identical responses (a 404 for a now-rotated/expired hero path, and a clean `200`/`access-control-allow-origin: *` for a currently-valid one) — i.e., the CDN does not vary its response based on those headers.
- A **fresh, currently-active** hero image URL fetched from `/api/hero-slides?scope=HOME` was confirmed to serve correctly:
  ```
  HTTP/2 200, content-type: image/webp, x-vercel-cache: HIT, cache-control: public, max-age=2592000
  ```
- The Home hero image set is actually a **mix** of Vercel Blob-hosted images and `images.unsplash.com`-hosted images (visible in the `/api/hero-slides` payload). Both CDNs responded correctly from this test location.

### What could NOT be checked
- This environment has no way to originate a request from an actual Nigerian IP/ISP, and no access to Vercel's dashboard/analytics or deployment logs (no CLI session authenticated to the Vercel account was available). So a genuine ISP-level DNS/routing issue, a Nigeria-specific CDN edge outage, or a transient regional Vercel/Blob incident **cannot be ruled out** — but there is **no code-level cause** (no allowlist gap, no geo-logic, no proxy-timeout-prone code path, since `unoptimized` sidesteps the proxy) that would explain a Nigeria-specific failure.

### Honest conclusion
**This could not be reproduced or confirmed from this environment.** The most defensible statement is: nothing in the codebase discriminates by region, and the image delivery path (raw Blob/Unsplash URLs, not proxied) removes the most commonly-suspected culprit (Vercel Image Optimization API regional latency/timeouts). If this recurs, the highest-value next step is collecting a HAR file or screenshot with error details directly from an affected Nigerian user/device, or checking Vercel's dashboard "Real Experience"/Function logs filtered by country, rather than guessing further from here.

---

## 5. Static Asset Caching / CDN — CONFIRMED WORKING CORRECTLY

**Severity: None.**

### Evidence
- `_next/static/chunks/main-app-*.js` (immutable build asset):
  ```
  cache-control: public, max-age=31536000, immutable
  x-vercel-cache: HIT
  age: <large, incrementing across repeated requests>
  ```
- Vercel Blob-hosted hero image:
  ```
  cache-control: public, max-age=2592000
  x-vercel-cache: HIT
  age: 75952
  ```
- Unsplash-hosted hero image:
  ```
  cache-control: public, max-age=31536000
  x-cache: HIT, HIT
  age: 1177619
  ```
- All three asset classes show `HIT` and non-trivial `Age` values, confirming they are being served from Vercel's/the origin CDN's edge cache and are **not** being re-fetched from origin on every request.
- The dynamic HTML document itself (Home page, ISR with `revalidate = 60`) correctly shows `x-vercel-cache: STALE` with `cache-control: public, max-age=0, must-revalidate` — this is expected, correct ISR behavior (serve stale, revalidate in background), not a misconfiguration. (This STALE behavior is what feeds directly into Area 1's hydration timing bug, but the caching mechanism itself is working as designed.)

### Conclusion
No CDN/caching bug found. Static assets are cached correctly.

---

## 6. Default Landing Route — CONFIRMED WORKING CORRECTLY

**Severity: None.**

### Evidence
- `curl -D - https://jayshop-retail-platform.vercel.app/` (no path) returns `HTTP/2 200` with `x-matched-path: /`, confirming the bare production URL is served directly by the Home route with no redirect/rewrite.
- `src/middleware.ts` was reviewed in full — it contains route-guard logic for admin/auth-protected paths but no unconditional redirect, no locale-prefix redirect, and no legacy-route rewrite that could divert `/` to something else.
- `next.config.js` was reviewed — no `redirects()`/`rewrites()` entries that touch the root path.

### Conclusion
No bug found. The bare production URL reliably lands on Home.

---

## Recommended Next Steps (priority order)

1. **Fix Area 1 (hydration mismatch)** — highest-confidence, highest-severity finding with a clear code-level cause. Recommended approach: make `useStoreStatus()` timezone-aware (`America/Toronto`) and/or defer the "Open/Closed" label to a post-mount `useEffect` so the first paint renders a neutral/stable value on both server and client.
2. **Area 4 (Nigeria hero images)** — cannot be resolved further via code investigation alone. Next step is gathering direct evidence from the affected user (screenshot, HAR export, or browser console output) or checking Vercel's dashboard analytics/function logs filtered by country, since no code-level cause was found.
3. **Area 3 (marquee)** — no action recommended unless the user can reproduce it on a specific device/browser; ask for a screen recording if it persists.
4. Areas 2, 5, 6 — no action needed; confirmed working correctly.
