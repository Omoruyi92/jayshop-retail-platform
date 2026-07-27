# Jays Shop — Platform Content Source

**Purpose of this document:** This is the single factual reference for all subsequent documentation deliverables (project docs, user manual, UI/UX doc, presentation deck, business value report, epilogue). It is not a polished narrative — it is an accurate, code-grounded inventory of the system, so facts (route paths, model names, business rules) stay consistent across every downstream document.

- **Repository:** `/Users/idehenomoruyi/projects/jays-shop`
- **Production URL:** https://jayshop-retail-platform.vercel.app
- **Admin login (production):** admin@jays.shop
- **Generated:** 2026-07-22
- **Branch at time of writing:** `main` (128 commits)

---

## 1. System Architecture

Jays Shop is a **merchandise reservation web app** for a Toronto Blue Jays store — customers browse a live catalog and place a free, time-limited **hold** on an item (no payment, no account, no OTP), then show a QR code / reservation code in-store to pick it up. There is no e-commerce checkout/payment flow in the traditional sense — "cart" and "holds" are the closest storefront equivalent to a purchase funnel.

### 1.1 Framework & routing

- **Next.js 14.2.29** using the **App Router** (`src/app`), with **route groups** to separate concerns without affecting URL structure:
  - `src/app/(public)/` — the customer-facing storefront (home, shop, product detail, cart, holds, account, brands, players, styles, static/legal pages).
  - `src/app/(admin)/admin/` — the staff/owner dashboard (all routes protected by `middleware.ts`).
  - `src/app/(print)/admin/holds/[id]/print/` — a route group dedicated to a print-friendly hold receipt page (isolated from the normal admin layout/chrome so printing doesn't include the sidebar/nav).
  - `src/app/admin/login/` — the login page itself sits outside the `(admin)` group (matcher excludes it — see §5).
  - `src/app/api/` — all backend route handlers (~50 route folders), covering public reads (`/api/products`, `/api/holds`, `/api/players`, `/api/brands`, `/api/styles`, `/api/gallery`, `/api/promotions`, `/api/notifications`, `/api/chat`, `/api/reviews`, `/api/feedback`, `/api/customer-photos`, `/api/customer-style-submissions`), admin CRUD/read (`/api/admin/*`), a `/api/pos/transaction` webhook for register integration, `/api/cron/expire-holds` for scheduled hold expiry, and `/api/auth/[...nextauth]` for admin session auth.
- **TypeScript** throughout; path alias `@/*` → `src/*` (per `tsconfig.json`).

### 1.2 Data layer

- **Prisma ORM 5.22** (`@prisma/client`) as the sole DB access layer — a single shared client singleton in `src/lib/prisma.ts`.
- **PostgreSQL** as the datasource (`prisma/schema.prisma` → `provider = "postgresql"`, connection via `DATABASE_URL`). The README's local-dev instructions describe a self-hosted Postgres 16 via Docker Compose for local development; in production this points at a managed Postgres instance — the task brief names **Neon**, and `.env.example` explicitly says "In production (Vercel), point this at your managed Postgres instance (e.g. Neon, Supabase, RDS, Railway) — any standard Postgres connection string works," so the app is provider-agnostic at the code level even though Neon is the one actually used in production.
- Multi-tenancy is modeled (`Tenant` model, `tenantId` FKs on `Product`, `StoreLocation`, `Admin`, `Player`) but the app currently runs as a single default tenant (`getDefaultTenantId()` in `src/lib/tenant.ts`) — the schema is tenant-ready but not multi-store-operator today.

### 1.3 Auth

- **NextAuth 4.24** with a `CredentialsProvider` (email + password) for the **admin/staff side only** (`src/lib/auth.ts`). Sessions are JWT-based with an **8-hour absolute max age** (`maxAge: 8 * 60 * 60`). Passwords are hashed with **bcryptjs**.
- **Customers never authenticate** — the storefront hold flow only asks for name + phone number (`src/app/(public)/account/page.tsx`), matching the README's stated "no OTP in v1" design. Phone number is the customer's de facto identity key (`Customer.phone` is `@unique`).
- Role-based access is enforced centrally in `src/middleware.ts` (see §5) plus a `useCurrentAdmin` hook and per-route guards.

### 1.4 Media storage

- **Vercel Blob** (`@vercel/blob` ^2.6.1) is used for all *new* image uploads in production. `src/lib/media/upload.ts` checks for `BLOB_READ_WRITE_TOKEN`: if present, uploads go to Blob (`put()`, public access, `addRandomSuffix: false`) and the function returns the Blob's public HTTPS URL; if absent (typical local dev), it falls back to writing under `public/uploads/` on the local filesystem — preserving the original local-dev workflow with zero extra setup. Deletes (`deleteUploadedFile`) mirror this dual-path logic and are best-effort (never throw).
- All uploaded images are normalized through **sharp** (`src/lib/media/optimizeImage.ts`): EXIF auto-rotate, capped at 2400px max dimension (never upscaled), re-encoded to WebP at quality 90 (animated GIFs are preserved as-is to keep animation frames).
- `next.config.js` configures Next/Image to serve AVIF/WebP with a device-size ladder tuned to the app's actual breakpoints (360–2400px) and whitelists `*.public.blob.vercel-storage.com` as a remote image host, alongside legacy hosts (Cloudinary, MLB static, Unsplash, iStock) retained from earlier asset sourcing.
- This Blob migration (commit `3e718ec`, "fix: migrate image uploads to Vercel Blob storage for production persistence") fixed a real production bug: Vercel's serverless functions have a read-only, ephemeral filesystem, so writes to `public/uploads/` at runtime either failed outright or vanished on the next deploy — new admin-uploaded images were not surviving redeploys before this fix.

### 1.5 Hosting / deployment model

- **Vercel** hosting (`vercel.json` defines a single cron job). `npm run build` runs `prisma generate && next build`; `postinstall` also runs `prisma generate` so the Prisma client is always regenerated on deploy.
- **Vercel Cron** triggers `POST /api/cron/expire-holds` once daily (`0 0 * * *` per `vercel.json`) as the scheduled backstop for hold expiration — see §6 for why this is a backstop rather than the primary mechanism.
- **next-pwa** (Workbox) is enabled for production builds only (`disable: process.env.NODE_ENV === 'development'`), giving the storefront installable/offline-capable PWA behavior with a manifest and app icons under `public/`.
- No separate backend service exists — Next.js API routes are the entire backend; the "POS integration" is a webhook contract (`POST /api/pos/transaction`) rather than a running service.

### 1.6 Request flow (plain-language summary)

1. **Storefront pages** (`(public)` route group) are a mix of Server Components that query Prisma directly at request time (e.g. `/`, `/shop`, `/brands/[slug]`, `/shop-by-style/[slug]`, `/holds/[reservationId]`) and a smaller set of client components that fetch from `/api/*` after mount (e.g. `/players`, `/players/[slug]` — flagged in the perf diagnostic as a caching/SSR gap, see §7).
2. **Admin panel** (`(admin)` route group) is guarded by NextAuth + `middleware.ts` role checks before any page or API route executes; admin pages call the `/api/admin/*` route handlers, which call Prisma directly (no separate service layer).
3. **API routes** are the single source of truth for all mutations (hold create/resolve, inventory transfer, product CRUD, etc.) — they run business logic in `src/lib/holds/*`, `src/lib/inventory/*`, `src/lib/pos/*`, wrapped in Prisma `$transaction`s for atomicity.
4. **POS integration** is inbound-only: an external register system calls `POST /api/pos/transaction` with a Bearer API key (`PosApiKey`), and the app applies sale/return deltas to `SizeInventory`, logs an idempotent `PosEvent`, and writes `InventoryTransaction`/`SalesHistory` rows — see §6/§4 POS section.
5. **Real-time updates**: a lightweight in-process `broadcaster` (`src/lib/realtime/broadcaster.ts`) publishes `hold_changed` events consumed via Server-Sent Events (`/api/realtime/inventory`), used by `useInventoryStream` to keep admin/storefront inventory numbers live without polling.

---

## 2. Tech Stack (from `package.json`)

| Category | Library | Version |
|---|---|---|
| Framework | `next` | 14.2.29 (App Router) |
| Language | `typescript` | ^5 |
| UI runtime | `react` / `react-dom` | ^18 |
| ORM | `@prisma/client` / `prisma` | ^5.22.0 |
| Auth | `next-auth` | ^4.24.10 |
| Password hashing | `bcryptjs` | ^2.4.3 |
| Media storage | `@vercel/blob` | ^2.6.1 |
| Image processing | `sharp` | ^0.35.3 |
| Styling | `tailwindcss` | ^3.4.1 |
| Animation utility | `tailwindcss-animate` | ^1.0.7 |
| Class utilities | `clsx`, `tailwind-merge`, `class-variance-authority` | 2.x / 2.x / 0.7.1 |
| Headless UI primitives | `@radix-ui/react-dialog`, `@radix-ui/react-slot` | ^1.1.x |
| Icons | `lucide-react` | ^0.469.0 |
| Charts | `recharts` | ^2.15.4 (admin Analytics/Reports) |
| QR codes | `qrcode.react` | ^4.2.0 (client-side hold receipt QR) |
| Toasts | `sonner` | ^1.7.4 |
| AI chat | `openai` | ^4.104.0 (gpt-4o-mini "Birdie" assistant) |
| ID generation | `nanoid` | ^5.0.9 |
| PWA | `next-pwa` | ^5.6.0 |
| DB driver (raw) | `pg` | ^8.22.0 |
| Legacy/unused-in-prod | `@supabase/supabase-js` | ^2.45.4 (present in deps; primary DB access is via Prisma, not the Supabase JS client — see `src/lib/supabase.ts`) |
| Dev: type-check | `typescript` via `tsc --noEmit` | script: `npm run typecheck` |
| Dev: lint | `eslint` + `eslint-config-next` | ^8 / 14.2.29 |
| Dev: local SQLite (legacy) | `better-sqlite3` | ^12.11.1 (used by `prisma/port-legacy-sqlite.ts` migration script, not the running app) |
| Dev: seed runner | `tsx` | ^4.19.2 |
| CSS processing | `postcss`, `autoprefixer` | ^8 / ^10 |

**No dedicated automated test framework** (e.g. Jest/Vitest/Playwright) is present in `package.json` — there are no `test` script entries. Manual/scripted verification (Playwright screenshots, direct API calls, `tsc`/`eslint`) appears to be the actual QA method used per commit messages, not a checked-in automated test suite. **This should be flagged in the maturity narrative as an area of opportunity, not glossed over.**

---

## 3. Database Overview (`prisma/schema.prisma`, 27 models + 3 enums)

### Core catalog

- **`Tenant`** — top-level store/organization scope. Has `isDefault` flag; app currently operates as a single default tenant. Owns `products`, `locations`, `admins`, `players`.
- **`Product`** — the sellable item. Rich flat schema (not normalized into separate "variant" tables): `priceCents`, `salePriceCents`, `originalPriceCents`, `quantity`/`heldQuantity`/`pickedQuantity` (product-level aggregate counters — kept in sync with `SizeInventory` when a product has size rows), `status` (`AVAILABLE`/`SOLD`/etc., string not enum), boolean merchandising flags (`isLicensed`, `isChampion`, `isBestSeller`, `isClearance`, `isFeatured`, `isNewArrival`, `isSport`, `isWorldSeries`, `isBlankJersey`), `holdEnabled` (per-product opt-out of the hold feature), up to 3 image URLs, `sku`, `material`, `careInstructions`, `highlights`, JSON `colors`. Linked to `Brand`/`Category` by denormalized string fields (`category`, `subcategory`, `brand`) rather than FKs in most cases (with `CategoryBrand`/`CategoryProductType` as the newer, more structured join tables — see below).
- **`Category`** — hierarchical (self-referential `parentId`/`children`) taxonomy with `sortOrder` (sibling ordering) and a distinct `sortPriority` (cross-category product sort bucket on the default unfiltered Shop view, e.g. Jerseys=1, Hats=2, Fleece=3, Accessories=4 — explicitly documented in-schema as *not* the same concept as `sortOrder`).
- **`CategoryProductType`** — admin-managed "Type" options (e.g. Jerseys, Fleece, Hats) scoped to a category, replacing a previously hardcoded `PRODUCT_TYPES_BY_CAT` constant so admins can add/remove/rename types without a deploy.
- **`CategoryBrand`** — join table assigning existing `Brand` records to a category, replacing a previously hardcoded `BRANDS_BY_CAT` constant. Together with `CategoryProductType`, this represents a deliberate migration from hardcoded taxonomy constants to admin-editable DB-backed taxonomy.
- **`Brand`** — logo/name/status, globally unique by name and slug.
- **`StyleCategory`** + **`ProductStyle`** — the "Shop by Style" merchandising concept (e.g. Jerseys, Streetwear, Game Day Fits, Jackets, Hats, Hoodies) — explicitly noted in-schema as *distinct* from `Category` (product taxonomy); a many-to-many join so one product can belong to multiple styles. Has its own hero image/video/overlay/CTA fields for a dedicated landing page.
- **`Player`** + **`PlayerProduct`** — player profile pages (bio, stats JSON, hero image) with a many-to-many join to `Product` ("shop this player's gear").

### Holds & inventory (the signature feature — see §6 for full lifecycle)

- **`Customer`** — identified by unique `phone`; no password/auth, just `fullName` + `phone`.
- **`Hold`** — an active reservation: `reservationCode` (unique, customer-facing), `productId`, `customerId`, `size`, `holdQuantity`, `totalPriceCents`, `status` (`ACTIVE`/`PICKED_UP`/`RELEASED`/`EXPIRED` as a string field), `placedAt`/`expiresAt`/`pickedUpAt`/`releasedAt`, `isStadiumHold` (Section 123 express-pickup path vs. standard Gate 5 path), `pickupQueueAt`/`queuePosition` for the stadium queue.
- **`SizeInventory`** — the real source of truth for stock: per-product, per-size, **per-location** row (`quantity`, `heldQuantity`, `pickedQuantity`), unique on `(productId, size, locationId)`. Product-level `quantity`/`heldQuantity`/`pickedQuantity` fields are denormalized aggregates resynced from these rows (`syncProductTotalsFromSizeInventory`).
- **`StoreLocation`** — 12 predefined physical fulfillment points (see §6), each with `isMainStore`/`isPickupQueue` flags, `active`, and links to `PosApiKey`.
- **`InventoryTransaction`** — append-only ledger of every stock movement (`type`: `transfer`/`adjustment`/`sale`/`return`/`hold-reserve`/`hold-release`/`assign`/`remove`), with `fromLocationId`/`toLocationId`, signed `quantity`, `actorId`/`actorEmail`, free-text `note`. This is the audit trail behind the admin "Inventory History" page.
- **`HoldHistory`** — permanent snapshot record written every time a hold resolves (picked up / released / expired) — captures product name/brand/price/image *at the time*, customer name/phone, quantities, final status, resolving admin. Critically, **`HoldHistory` has no FK to `Product`**, which is what makes it safe to hard-delete `Product` rows later (see §7 FK bug).
- **`SalesHistory`** — written only when a hold is actually fulfilled (picked up) or a POS sale occurs; feeds revenue/analytics reporting.
- **`HoldSettings`** — singleton-ish config row: `enable48HourHold` toggle, `standardHoldHours` (default 4), `extendedHoldHours` (default 48) — the admin-configurable knobs behind the hold-duration business rule (see §6).
- **`GameDay`** — calendar of home game dates (`date` unique, `opponent`, `note`, `startTime`) — drives the game-day-aware hold duration rule and Section 123 stadium-queue eligibility.

### POS integration

- **`PosApiKey`** — one bcrypt-hashed key per register/location; raw key shown once at creation. Scoped optionally to a `StoreLocation`.
- **`PosEvent`** — append-only, idempotent audit log of every `POST /api/pos/transaction` call, keyed by POS-supplied `externalId` for dedupe; `status`: `applied`/`rejected`/`deduped`.

### Admin / governance

- **`Admin`** — email/passwordHash/`role` (enum `AdminRole`: `OWNER`/`MANAGER`/`STAFF`/`VIEWER`), scoped to a `Tenant`.
- **`AuditLog`** — generic before/after JSON audit trail keyed by `entityType`/`entityId`/`action`, with actor info and IP/user-agent — broader than `InventoryTransaction` (covers holds, products, etc., not just stock moves).
- **`SlackSettings`** — per-store Slack webhook config for notifications (with an env-var fallback, see §7).

### Content / merchandising / community

- **`HeroSlide`** — admin-managed hero banner slides, scoped by `SlideScope` enum (`HOME`/`SHOP`/`STYLE_LANDING`/`PLAYERS`), supports `MediaType` enum (`IMAGE`/`VIDEO`) with separate mobile URL.
- **`PromotionMessage`** — admin-created promo banner/marquee text with approval workflow (`status`, `approvedBy`/`approvedAt`), scheduling (`startsAt`/`expiresAt`), `priority`.
- **`StoreGalleryImage`** — admin-curated store photo gallery.
- **`CustomerPhoto`** / **`CustomerStyleSubmission`** + **`CustomerStyleImage`** — customer-submitted "style" photos tied to a specific product, with moderation status (`PENDING`/`APPROVED`/`REJECTED` via `SubmissionStatus` enum for submissions; string status for `CustomerPhoto`).
- **`ProductReview`** — customer reviews with star rating + moderation (`status`, `moderatedAt`/`moderatedBy`).
- **`ProductLike`** — anonymous session-based "like" (heart) tracking per product.
- **`SiteFeedback`** — general site feedback form submissions with moderation status.
- **`CustomerNotification`** + **`CustomerNotificationReceipt`** — "New Arrival"-style notification broadcast system with per-customer read/opened receipts and optional expiry.

---

## 4. Feature Breakdown

### 4.1 Storefront (`(public)` route group)

| Route | Purpose | Key actions / business rules |
|---|---|---|
| `/` (Home) | Landing page — hero slideshow, featured products, promo banner | Hero slides scoped `HOME`; server-rendered |
| `/shop`, `/shop/[slug]` | Category browsing + product detail | Category mega-menu (3-level hover), sticky nav that hides on scroll-up, size/quantity selection, "More Info" modal (SKU/material/care), style submission CTA |
| `/shop-by-style`, `/shop-by-style/[slug]` | "Shop by Style" merchandising landing + filtered listing | Masonry cards linking to style detail; `/shop-by-style/[slug]` is explicitly documented in-code as a **functional placeholder** pending a fuller filtered-listing build (see §10 Roadmap) |
| `/brands`, `/brands/[slug]` | Brand directory + brand-specific product listing | Category-grouped carousel sections |
| `/players`, `/players/[slug]` | Player profiles + "shop this player's gear" | Client-fetched (not SSR) — flagged perf gap, see §7 |
| `/cart` | Simple cart view (pre-hold staging area) | No payment; cart items convert into a hold, not a purchase |
| `/holds/[reservationId]` | Hold receipt page with QR code | Shown immediately after placing a hold; encodes reservation for in-store scan |
| `/my-holds` | Customer's own active/past holds by phone lookup | No account — phone number is the lookup key |
| `/account` | Phone-based identity entry (name + phone, no OTP) | Feeds `Customer` upsert used by hold creation |
| `/gallery` | Store photo gallery (admin-curated `StoreGalleryImage`) | Read-only browsing |
| `/support` | Customer support / Birdie AI chat entry point | Chat FAB present sitewide (`ChatFAB`) |
| `/about`, `/about-us` | Store/brand info pages | Static content |
| `/discounts` | Sales & clearance listing | Filtered product view |
| `/size-chart`, `/returns`, `/policy`, `/privacy`, `/terms`, `/product-concerns`, `/style-submission-policy` | Legal/informational static pages | No dynamic data |

Bottom nav (mobile, `BottomNav.tsx`) surfaces only 3 destinations: **Shop**, **My Holds**, **Chat** — reflecting that the entire customer journey is Browse → Hold → Pick up, not a traditional cart/checkout funnel.

### 4.2 Admin panel (`(admin)/admin`, grouped per `AdminSidebar.tsx`)

**Overview**
- **Dashboard** (`/admin`) — landing page for staff, role-visible to all (VIEWER+).

**Catalog**
- **Products** (`/admin/products`) — full CRUD, per-size/per-location inventory assignment via `ProductLocationsModal`, bulk fields (highlights, colors, care instructions). Read = VIEWER+, write = MANAGER+ (per middleware).
- **Categories** (`/admin/categories`) — manage hierarchical categories, admin-editable Types (`CategoryProductType`) and Brand links (`CategoryBrand`). MANAGER+.
- **Brands** (`/admin/brands`) — brand CRUD with logo upload or URL. MANAGER+.
- **Gallery** (`/admin/gallery`) — store photo gallery CRUD. MANAGER+.
- **Styles** (`/admin/styles`) — "Shop by Style" category CRUD + product assignment (`StyleProductsModal`). STAFF+ for the nav link, though the underlying model management sits alongside Manager-gated catalog features.
- **Players** (`/admin/players`) — player profile CRUD + linked-product assignment. MANAGER+.
- **Promotions** (`/admin/promotions`) — promo banner/marquee CRUD with approval workflow. MANAGER+.

**Operations**
- **Holds** (`/admin/holds`) — live queue of active holds; mark picked up / release, partial fulfillment support. STAFF+.
- **Hold Settings** (`/admin/hold-settings`) — configure `enable48HourHold`, `standardHoldHours`, `extendedHoldHours`. MANAGER+.
- **Inventory History** (`/admin/inventory/history`) — read-only ledger view of `InventoryTransaction` rows; also home to inter-location `TransferModal`. STAFF+ (transfer itself is MANAGER+ per middleware: `/api/admin/inventory/transfer`).
- **Game Days** (`/admin/game-days`) — CRUD for home game dates that drive hold-duration and Section 123 eligibility rules. MANAGER+.

**POS**
- **POS Keys** (`/admin/pos-keys`) — issue/revoke `PosApiKey` records (raw key shown once). **OWNER-only.**
- **POS Events** (`/admin/pos-events`) — audit view of applied/rejected/deduped POS transactions. STAFF+.
- **POS Simulator** (`/admin/pos-simulator`) — a tool to fire test POS transactions without a real register. **OWNER-only.**

**Insights**
- **Analytics** (`/admin/analytics`) — overview metrics (charts via `recharts`). VIEWER+.
- **Reports** (`/admin/reports`) — top held/sold, conversion/no-show style metrics, CSV export (export endpoint is MANAGER+). VIEWER+ for viewing.
- **History** (`/admin/history`) — resolved-hold history browser (`HoldHistory`) with filters, CSV export (export is MANAGER+). VIEWER+ for viewing.
- **Audit Log** (`/admin/audit-log`) — full `AuditLog` browser. **OWNER-only.**

**Community**
- **Reviews** (`/admin/reviews`) — moderate `ProductReview` (approve/reject). VIEWER+ read, STAFF+ write.
- **Style Submissions** (`/admin/customer-style-submissions`) — moderate customer-submitted style photos. STAFF+.
- **Feedback** (`/admin/feedback`) — moderate `SiteFeedback`. VIEWER+ read, STAFF+ write.
- **Notifications** (`/admin/notifications`) — manage `CustomerNotification` broadcasts (e.g. New Arrival pings). VIEWER+.

**Media**
- **Hero Media** (`/admin/hero-media`) — manage `HeroSlide` rows per scope (Home/Shop/Style Landing/Players), image or video, reorder. MANAGER+.

**Admin**
- **Admins** (`/admin/admins`) — manage `Admin` accounts/roles. **OWNER-only.**
- **Settings** (`/admin/settings`) — general settings + password change (password change itself is open to any authenticated admin for their own account). **OWNER-only** for the settings page broadly.

Not in the sidebar but present as routes: `/admin/unauthorized` (redirect target for role violations) and the `(print)/admin/holds/[id]/print` receipt-printing route (isolated layout, no sidebar chrome).

---

## 5. User Roles and Permissions

Defined via the `AdminRole` enum (`OWNER` > `MANAGER` > `STAFF` > `VIEWER`) and enforced in **`src/middleware.ts`**, which maps URL path prefixes (both page routes and `/api/admin/*` routes) to a minimum required role, with method-specific overrides (e.g. reads allowed at a lower role than writes on the same prefix). This is a single centralized authorization policy file — not scattered per-page checks.

| Role | Can do |
|---|---|
| **VIEWER** | Read-only: Dashboard, Products (read only), Analytics, Reports (view), History (view), Reviews (view), Feedback (view), Notifications (view), Slack settings (view) |
| **STAFF** | Everything VIEWER can, plus: Holds (resolve/release), Inventory History (view), POS Events (view), Style Submissions moderation, Reviews/Feedback write actions, Slack settings write/test |
| **MANAGER** | Everything STAFF can, plus: Hold Settings, Game Days, Categories, Brands, Gallery, Players, Promotions, Hero Media, Inventory Transfer, Products write (create/edit/delete), Reports/History CSV export |
| **OWNER** | Everything MANAGER can, plus: Admins (user management), Settings, Audit Log, POS Keys, POS Simulator |

**Customers** are not an authenticated role at all — no login, no password, no session; identity is just name + phone captured at hold-creation time, matched against the `Customer.phone` unique key on repeat visits. This is a deliberate low-friction design choice (README: "no payment, no account required").

**Session model:** NextAuth JWT session, 8-hour absolute max age (`src/lib/auth.ts`), with a client-side `AdminInactivityGuard` / `useAdminSessionTimeout` hook layered on top for inactivity-based sign-out. Role is re-read from the DB on every login and on session `update()` (fixed in commit `6650479`, "resolve role persistence bug by loading role from DB record on every login and refresh").

---

## 6. Hold & Reservation Workflow (signature feature — full lifecycle)

### 6.1 Two fulfillment paths

The system supports two distinct hold "shapes," both governed by the same `createHold`/`resolveHold` engine (`src/lib/holds/createHold.ts`, `resolveHold.ts`):

1. **Standard hold ("Gate 5" path)** — fulfilled from **Section 110 / Gate 5**, the designated `isMainStore` location (`StoreLocation.code = 'SEC-110'`).
2. **Stadium hold ("Section 123 pickup queue")** — an express, game-day-only path fulfilled from **Section 123**, the designated `isPickupQueue` location (`code = 'SEC-123'`). Enforced server-side (`createHold.ts`): a stadium hold is rejected with `SECTION_123_GAME_DAY_ONLY` unless `isGameDay(now)` is true (checked against the `GameDay` calendar), regardless of what the client claims. Stadium holds also get a `pickupQueueAt` timestamp set 30 minutes after creation (a queue-slot concept).

There are **12 predefined store/pickup locations** total (`src/lib/store-locations.ts`: SEC-110, GATE-1, SEC-114, SEC-123, SEC-133, SEC-136, SEC-146, SEC-213, SEC-235, SEC-515, SEC-525, SEC-530) — only two of the twelve (SEC-110 and SEC-123) are actual hold-fulfillment endpoints; the rest represent other physical stock locations reachable via admin inventory transfer.

### 6.2 Placing a hold (`createHold`)

1. **Inline auto-expiry** runs first (best-effort, never blocks) — releases any overdue `ACTIVE` holds back into sellable stock before checking availability, so a stale hold can never block a new reservation between scheduled cron runs.
2. **Customer upsert** by phone (`Customer.phone` unique) — creates or updates the customer record.
3. **Hold-limit check** — a customer may have **at most 3 simultaneous ACTIVE holds** (`activeCount >= 3` throws `HOLD_LIMIT_REACHED`).
4. **Game-day check** for stadium holds (see above).
5. **Effective hold duration** is computed by `getEffectiveHoldHours()`:
   - Stadium/Section 123 holds **always** use `standardHoldHours` (default **4 hours**) — it's explicitly an express pickup path.
   - Standard/Gate 5 holds get the **extended** duration (default **48 hours**) only when the admin-configurable `HoldSettings.enable48HourHold` toggle is on **and** it is not currently a game day; otherwise they also fall back to `standardHoldHours`.
   - This is fully admin-tunable via `/admin/hold-settings` (`HoldSettings` model: `enable48HourHold`, `standardHoldHours`, `extendedHoldHours`).
6. **Reservation code** generated (`generateReservationCode()`), and the fulfilling `locationId` resolved (`getHoldReservationLocationId`).
7. **Atomic transaction** (`prisma.$transaction`):
   - Re-checks availability *inside* the transaction, scoped to the fulfilling location's `SizeInventory` rows (so a hold can never draw from stock that physically lives at a different section) — subtracting both `heldQuantity` and `pickedQuantity` from `quantity`.
   - For sized products, validates the specific size is stocked at that location; for sizeless products, a synthetic `ONE_SIZE` `SizeInventory` row is used so both paths flow through identical inventory math.
   - Increments `SizeInventory.heldQuantity` and `Product.heldQuantity` atomically.
   - Resyncs the denormalized `Product`-level aggregate counters from the true `SizeInventory` rows.
   - Flips `Product.status` to `SOLD` if this hold consumed the last available unit.
   - Writes an append-only `InventoryTransaction` (`type: 'hold-reserve'`).
   - Publishes a `hold_changed` real-time event (best-effort, non-blocking) for live dashboard updates.
   - Writes an `AuditLog` entry (`action: 'hold.created'`).
8. The customer is shown a **QR code** (client-side, `qrcode.react`) encoding the reservation on the `/holds/[reservationId]` receipt page.

### 6.3 In-store scan / resolution (`resolveHold`)

Staff resolve a hold via the admin Holds page, supporting **three outcomes** plus **partial fulfillment**:

- **`PICKED_UP`** (full) — entire `holdQuantity` moves from `heldQuantity` → `pickedQuantity` on both `Product` and `SizeInventory`; writes `HoldHistory` (permanent snapshot) **and** `SalesHistory` (feeds revenue reporting); logs an `InventoryTransaction` of type `sale`.
- **Partial pickup** (`0 < fulfilledQty < holdQuantity`) — the fulfilled portion moves to `pickedQuantity`; a **new `ACTIVE` hold is created** for the remaining quantity, inheriting the original expiry (`expiresAt`) — so the customer doesn't lose their remaining reserved stock or its original deadline.
- **`RELEASED`** (`fulfilledQty === 0`, e.g. staff/customer cancels or a no-show is manually released) — entire held quantity returns to available stock; `HoldHistory` written, no `SalesHistory`; `InventoryTransaction` type `hold-release`.
- **`EXPIRED`** — same inventory-return effect as `RELEASED` but with `finalStatus: 'EXPIRED'` and no `resolvedByAdminId` (system-triggered, not staff-triggered).

After any resolution, `Product.status` is recalculated (`SOLD` if no stock remains available, `AVAILABLE` otherwise), a `hold_changed` real-time event fires, and an `AuditLog` entry (`hold.picked_up` / `hold.released` / `hold.expired`, `.partial` suffix where applicable) is written.

### 6.4 Automatic expiration (dual mechanism)

1. **Inline/lazy expiry** — `autoExpireOverdueHolds()` runs at the *start* of every `createHold` call (and likely other list-read paths), finding all `ACTIVE` holds where `expiresAt <= now` and resolving each as `EXPIRED` independently (try/catch per hold, so one failure doesn't block the rest). This guarantees no customer/admin ever sees a stale "ACTIVE" hold that's actually overdue, even between scheduled cron runs.
2. **Scheduled/cron expiry** — `POST /api/cron/expire-holds`, triggered daily at midnight UTC by Vercel Cron (`vercel.json`: `"schedule": "0 0 * * *"`) as a backstop, guarded by a shared `CRON_SECRET` bearer token.

### 6.5 Reconciliation / audit trail

Every state change in the hold lifecycle writes to **three separate append-only records** for full traceability: `InventoryTransaction` (stock-movement ledger), `HoldHistory` (permanent per-hold resolution snapshot, survives even if the `Product` is later deleted since it has no FK to `Product`), and `AuditLog` (generic actor/before/after audit trail). `SalesHistory` additionally captures fulfilled (sold) holds for revenue reporting. This three/four-way redundancy is a deliberate design choice for a cash-free, receipt-free retail model where the hold record *is* the transaction record.

---

## 7. Security & Performance Considerations

### 7.1 Security posture

- **Admin auth**: NextAuth JWT + bcrypt password hashing, 8-hour absolute session expiry, centralized role-based middleware (`src/middleware.ts`) gating both page routes and API routes by path prefix + HTTP method — a single policy surface rather than scattered per-endpoint checks, reducing the chance of an unguarded admin route.
- **POS auth**: separate bearer-token scheme (`src/lib/pos/auth.ts`) — raw API keys are bcrypt-hashed at rest (`PosApiKey.keyHash`), shown to the admin only once at creation, never logged. A short-lived (5s) in-memory cache keyed by SHA-256 digest of the raw key avoids paying a ~60-100ms bcrypt compare on every request from a hot POS register, while revocation (`active=false`) is still picked up on the next cache miss.
- **POS rate limiting**: `checkRateLimit()` enforces **50 requests/sec per API key** on `POST /api/pos/transaction` (`src/lib/pos/rateLimit.ts`), returning HTTP 429 when exceeded.
- **POS idempotency**: `PosEvent.externalId` is a unique dedupe key — replayed webhook calls return `{ deduped: true, eventId }` instead of double-applying inventory changes; a race-condition path is also handled (two concurrent requests with the same `externalId` both pass the pre-check, then the DB unique constraint catches the loser, which is treated as a normal dedupe rather than an error).
- **Input validation**: POS transaction body is validated field-by-field (non-empty `externalId`, `type` must be `'sale'|'return'`, non-empty `items` array, positive integer quantities, required `productId`/`sku`) before any DB write; oversell is rejected transactionally with a per-item failure report rather than partially applying.
- **Secrets handling**: `.env`/`.env.local` are gitignored; `.env.example` documents every required var with no real values. Cron endpoint is protected by a dedicated `CRON_SECRET` bearer token, separate from admin/POS auth. A dedicated commit (`11bbfc5`, "ignore session/token dump files (cookies, headers) to prevent re-leak") shows active vigilance against credential leakage.
- **Diagnostic hygiene**: a temporary debug commit (`f9e293e`) that exposed Blob-env-var-presence and deployed commit SHA on `/api/admin/health` for production troubleshooting was explicitly reverted once the investigation was done (`04e752e`, "revert temporary blob/commit-sha diagnostic fields") — evidence of a deliberate "diagnose, then clean up" discipline rather than leaving debug scaffolding in production.
- **Data-integrity fix**: product deletion previously could throw a raw Prisma P2003 foreign-key violation if any historical `Hold` row (even a long-resolved one) referenced the product, because `Hold.product` is a non-cascading (`RESTRICT`) relation. Fixed (`3fb7c7d`) by: blocking deletion with a clear 409 error if a *genuinely active* hold still reserves stock, otherwise safely clearing resolved `Hold` rows in a transaction before deleting the product (safe because `HoldHistory` — the permanent record — has no FK to `Product`). Verified against the dev Postgres DB by deliberately reproducing the P2003 failure first.

### 7.2 Image / media

- **Vercel Blob** for production uploads (persists across serverless redeploys, unlike local filesystem writes — see §1.4), local filesystem fallback for dev.
- **sharp**-based normalization pipeline (EXIF rotation fix, 2400px cap, WebP re-encode at quality 90) applied to every uploaded image uniformly (products, banners, gallery, players, brands, style submissions).
- Next/Image serves AVIF/WebP with a tuned device-size ladder matching real breakpoints used across the app.

### 7.3 Known past issues fixed (framed as evidence of active maintenance / quality maturity — see §9 for the fuller narrative)

- Product-delete FK violation from resolved holds (`3fb7c7d`) — root-caused, reproduced, fixed, and verified against the real DB before merge.
- Focus-loss bug in every admin modal (`2091955`) — root cause was `useFocusTrap`'s effect depending on a fresh-per-render inline callback, causing the modal to re-focus its first element on every keystroke in a controlled input. Fixed with a ref-based pattern; this was a single shared-hook fix that transitively fixed every modal built on `Dialog`/`useFocusTrap` (Brands, Products, Players, Styles, Gallery, Promotions, etc.) rather than needing per-modal patches.
- Missing store locations / greyed-out checkbox bug (`2091955`) — root cause was the HTML `disabled` attribute visually greying out the whole Main Store control instead of just preventing unchecking, compounded by a partially-seeded production DB. Fixed with a self-healing `ensureAllStoreLocations()` upsert (idempotent, never deletes) wired into both the admin inventory route and the public store-locations API, plus a readOnly-style checkbox pattern replacing `disabled`.
- 6 modal bugs in one audit pass (`2253c98`) — brand logo URL/file conflict (stale file silently winning over a newly typed URL), missing double-submit guards on 3 separate admin flows (Style Products assign/unassign, Hero Media reorder, POS Keys revoke/reactivate), duplicate toast stacking on Hero Media reorder, and silent no-op on empty Category input submission.
- Responsive/tablet audit (`bc14fba`) — a Tailwind utility-ordering conflict (`pt-14` mobile-header clearance silently overridden by `sm:p-6` shorthand at the 768px breakpoint) caused the OWNER profile badge and page content to overlap the fixed admin header on ~26 admin pages at tablet width; also added a persistent "Swipe table to see more" mobile hint + scroll-edge shadows to 9 wide admin data tables that previously gave no visible affordance for horizontal scroll on 375px screens.
- Header dropdown clipping off-screen on mobile (`d1629fa`) — Notifications/Favorites/Cart dropdowns were anchored `absolute right-0` to their own icon-button wrapper, which on narrow viewports (language selector + hamburger sitting to its right) was never actually flush with the screen edge — on a 375px viewport this clipped most of a 320px-wide panel off the left edge. Fixed with a new `useDropdownPosition` hook that measures real `getBoundingClientRect()` and renders the panel via `createPortal(document.body)` as `position:fixed`, clamped with an 8px gutter so it can never overflow either edge; verified with screenshots at 375/390/414/428px and 1280px.
- Product category-edit staleness (`98a27cf`) — editing a product's category in admin wasn't updating the `productType` field, causing the storefront to keep showing the stale category.

### 7.4 Performance considerations (from `docs/perf-diagnostic-phase1.md`, dated 2026-07-21 — a documented internal diagnostic pass)

- **Site-wide caching gap**: Home, Shop, and Players routes are all `export const dynamic = 'force-dynamic'`, meaning every page load/reload hits Postgres fresh with no HTTP caching, `unstable_cache`, or ISR (`revalidate`) in place for these specific routes — flagged as the top-priority fix, contrasted against `/shop-by-style/[slug]` and `/brands/[slug]` which *do* use `export const revalidate = 60`-style ISR correctly.
- **Players pages are client-fetch, not SSR** — unlike Home/Shop/Brands (async Server Components calling Prisma directly), `/players` and `/players/[slug]` are `'use client'` components that `fetch()` after mount, causing a guaranteed loading-skeleton flash on every visit and no ability to leverage route-level caching.
- **Duplicate network requests**: `/api/promotions` was observed firing 5x per page view (both `PromotionBanner` and `PartnerLogosBar` independently fetch it with no shared cache).
- **A real hardening gap identified but not yet fixed**: the client-side `/players` fetch has no `.catch()`, so any non-2xx response silently resolves to an empty player list with no visible error state — this was the diagnostic's leading hypothesis for a reported "blank players page" symptom (most likely caused by a transient 500 during a disk-pressure incident on the dev machine, not a persistent code defect).
- Confirmed **good patterns already in place**: no N+1 query pattern in the player→product join (single `include`, not per-product queries); correct DB indexes already present on `Player` (`isFeatured`, `isTrending`, `status`, `tenantId`); `next/image` used correctly with proper `sizes` attributes (confirmed a 360×240 render transferred 16.2KB vs. a 209-220KB source file).
- A broader site-wide performance/N+1/responsive-fix pass did land separately (commit `4e6f0c7`, "sitewide performance optimization - caching, N+1 fixes, responsive fixes").

---

## 8. UI/UX Inventory

### 8.1 Storefront pages (25 routes under `(public)`)

| Page | One-line purpose |
|---|---|
| `/` | Home — hero slideshow, featured products, promotions |
| `/shop` | Category-browsable product grid with mega-menu nav |
| `/shop/[slug]` | Product detail page (PDP) — images, size/qty, hold CTA, reviews, style submission |
| `/shop-by-style` | "Shop by Style" masonry landing (Jerseys, Streetwear, Game Day Fits, etc.) |
| `/shop-by-style/[slug]` | Style-filtered product listing (currently a functional placeholder — see §10) |
| `/brands` | Brand directory |
| `/brands/[slug]` | Brand-specific product listing with category-grouped carousels |
| `/players` | Player roster grid with search/filter |
| `/players/[slug]` | Player profile — bio, stats, shoppable gear |
| `/cart` | Pre-hold item staging area |
| `/holds/[reservationId]` | Hold receipt with QR code |
| `/my-holds` | Customer's hold history by phone lookup |
| `/account` | Phone-based identity entry |
| `/gallery` | Store photo gallery |
| `/support` | Support entry point / Birdie AI chat |
| `/about`, `/about-us` | Store/brand story |
| `/discounts` | Sales & clearance listing |
| `/size-chart` | Sizing reference |
| `/returns`, `/policy`, `/privacy`, `/terms`, `/product-concerns`, `/style-submission-policy` | Legal/informational pages |

### 8.2 Admin pages (27 routes under `(admin)/admin`, plus login + print)

| Page | One-line purpose |
|---|---|
| `/admin` | Dashboard landing |
| `/admin/products` | Product CRUD + inventory/location assignment |
| `/admin/categories` | Category tree + Types + Brand-links management |
| `/admin/brands` | Brand CRUD |
| `/admin/gallery` | Store gallery CRUD |
| `/admin/styles` | Shop-by-Style category CRUD + product assignment |
| `/admin/players` | Player profile CRUD + product linking |
| `/admin/promotions` | Promo banner CRUD + approval |
| `/admin/holds` | Live hold queue — resolve/release/partial pickup |
| `/admin/hold-settings` | Hold duration configuration |
| `/admin/inventory/history` | Inventory transaction ledger + transfer tool |
| `/admin/game-days` | Game-day calendar CRUD |
| `/admin/pos-keys` | POS API key issuance/revocation (Owner) |
| `/admin/pos-events` | POS transaction audit log |
| `/admin/pos-simulator` | Test-fire POS transactions (Owner) |
| `/admin/analytics` | Metrics overview with charts |
| `/admin/reports` | Sales/hold reports + CSV export |
| `/admin/history` | Resolved-hold history browser + CSV export |
| `/admin/audit-log` | Full audit trail browser (Owner) |
| `/admin/reviews` | Review moderation |
| `/admin/customer-style-submissions` | Style-submission photo moderation |
| `/admin/feedback` | Site feedback moderation |
| `/admin/notifications` | Customer notification broadcast management |
| `/admin/hero-media` | Hero slide management per page scope |
| `/admin/admins` | Admin user/role management (Owner) |
| `/admin/settings` | General settings + password change (Owner) |
| `/admin/unauthorized` | Role-violation redirect target |
| `/admin/login` | Admin sign-in (outside the protected route group) |
| `(print)/admin/holds/[id]/print` | Print-friendly hold receipt (isolated layout) |

### 8.3 Responsive breakpoints & mobile decisions

- Confirmed tested breakpoints (per the perf diagnostic and audit fix commits): **375px, 768px, 1280px**, with 390/414/428px also spot-checked for the header-dropdown fix, and 1920px implied as the standard desktop upper bound alongside the Tailwind default `xl` (1280px) breakpoint used to toggle the partner-logo bar/promo marquee layout in the header.
- Mobile-specific UI decisions already in place:
  - Bottom tab bar (`BottomNav`) with only 3 destinations (Shop / My Holds / Chat), `sm:hidden` — replaced by full header nav at desktop widths.
  - Mobile hamburger drawer for header nav (`Header.tsx`) with a slide-in panel and outside-click-to-close.
  - A secondary header strip (`xl:hidden`) surfaces the store location badge + promo marquee below the main nav row on any viewport narrower than `xl`, since the full partner-logos bar doesn't fit.
  - `useDropdownPosition` hook (see §7.3) ensures notification/favorites/cart dropdown panels are never clipped off-screen on narrow viewports, using `position: fixed` + portal rendering instead of viewport-unaware `absolute` anchoring.
  - Admin data tables use a shared `TableWrapper` with a persistent mobile-only "Swipe table to see more" hint and scroll-edge shadows for horizontal-scroll affordance on 375px screens.
  - Admin layout padding is split into independent `px-`/`pb-`/`pt-` utility groups (rather than a single `p-6` shorthand) specifically so the `pt-14` mobile/tablet fixed-header clearance can't be silently overridden by a later Tailwind utility at the `sm:` breakpoint.
- **PWA**: installable on Android Chrome / iOS Safari (Add to Home Screen) via `next-pwa` + manifest; production-only (disabled in dev).
- **Accessibility touches observed in code**: `aria-label`/`aria-haspopup`/`aria-expanded`/`role="listbox"`/`role="option"` on the language selector and header dropdowns; `aria-label` on hamburger/menu buttons; focus-trap (`useFocusTrap`) on all modal dialogs (with the focus-loss bug fixed per §7.3); alt text on brand/product imagery. No dedicated automated accessibility audit tooling (e.g. axe-core) was found in the dependency list — this is a manual/code-review-level a11y practice, not an automated-gate one.

---

## 9. Notable Engineering History (quality/maturity narrative material)

These are real, dated commits that demonstrate active, disciplined maintenance rather than a "ship and forget" codebase — useful raw material for a business-value/maturity narrative, framed honestly (bug fixes are evidence the team finds and fixes issues quickly, not evidence of instability):

1. **Comprehensive admin audit, in three coordinated passes** (all within a single day, per commit timestamps `2026-07-22`):
   - Focus-loss + missing-locations fix (`2091955`) — a single shared-hook root-cause fix that transitively resolved the issue across every admin modal in the app.
   - Modal audit (`2253c98`) — 6 distinct bugs fixed across Brands, Style Products, Hero Media, POS Keys, and Categories (double-submit guards, stale-toast stacking, conflicting-input silent-override, silent no-op on empty submit).
   - Responsive audit (`bc14fba`) — tablet header-overlap root-caused to a specific Tailwind utility-ordering conflict (not guessed at), plus a systemic mobile-table-scroll-affordance fix applied to 9 admin tables at once via a shared `TableWrapper` component.
   - Header dropdown clipping fix (`d1629fa`) — root-caused with exact pixel math (bell wrapper right edge at x=220 vs. panel starting at x=-100 on a 375px viewport), fixed with a reusable `useDropdownPosition` hook, verified across 5 breakpoints via real screenshots.
2. **Vercel Blob migration for persistent media** (`3e718ec`) — recognized and fixed a subtle platform-specific bug (serverless filesystem is read-only/ephemeral) before it caused silent data loss on every redeploy; designed with a zero-config local-dev fallback so the fix didn't complicate the development workflow.
3. **Self-healing store-location upsert logic** (`ensureAllStoreLocations()`, part of `2091955`) — rather than a one-time manual data-repair script, the fix is an idempotent upsert wired into normal request paths so a partially-seeded production DB self-repairs on the next relevant read, with zero admin intervention required and zero risk of deleting/duplicating existing data.
4. **Product-delete FK violation fix** (`3fb7c7d`) — diagnosed a real Prisma-level constraint interaction (RESTRICT relation + historical rows), fixed with a business-rule-aware distinction (block only on *genuinely active* holds, not historical ones), and explicitly verified against the dev database before merge — the commit message documents the exact repro/fix/verify sequence.
5. **GitHub webhook / deployment diagnosis and clean revert** — a temporary diagnostic addition to `/api/admin/health` (`f9e293e`, exposing Blob-env-var presence + deployed commit SHA to debug a production deployment/persistence issue) was cleanly reverted once resolved (`04e752e`), rather than left in production — showing discipline around not leaving debug surface area behind.
6. **Documented internal performance diagnostic pass** (`docs/perf-diagnostic-phase1.md`) — a structured, severity-ranked (Critical/Major/Minor) findings report with concrete evidence (curl timings, Playwright network captures, exact file:line references) rather than vague notes; explicitly separates "confirmed problems" from "checked, no issue found" (e.g. `Player` model indexes were verified present, not assumed).
7. **Taxonomy migration from hardcoded constants to admin-editable data** — `CategoryProductType` and `CategoryBrand` explicitly replaced previously hardcoded `PRODUCT_TYPES_BY_CAT`/`BRANDS_BY_CAT` constants (per in-schema comments), letting admins manage category Types and Brand associations without a code deploy — a meaningful reduction in operational friction for the store's day-to-day content management.

---

## 10. Roadmap / Future Enhancement Ideas (grounded in actual code hand-off notes — not speculative)

- **"Shop by Style" filtered listing page (Phase 4 hand-off)** — explicitly documented in code (`src/app/(public)/shop-by-style/[slug]/page.tsx`, lines 11-16): the current `/shop-by-style/[slug]` page is a *"functional placeholder (simple product grid)"*; a named future phase ("Phase 4") is scoped to own building out *"the full filtered listing experience (hero media per style, sorting/filtering, etc.)"* using the same `slug` param and the existing `GET /api/styles/[slug]` endpoint that already exists and works.
- **Phase 2 performance remediation** — per `docs/perf-diagnostic-phase1.md`, a concrete, already-scoped near-term backlog exists:
  - Convert `/api/players` and `/api/players/[slug]` to `unstable_cache`/ISR with `revalidatePath`/`revalidateTag` invalidation from admin mutation routes (pattern already used elsewhere per commit `755d802`).
  - Convert Players pages from client-fetch to Server Components (matching the pattern already used by Home/Shop/Brands), or at minimum hydrate from a server-fetched `initialPlayers` prop (same fallback-avoidance pattern already used for hero slides).
  - Deduplicate the 5x-per-page `/api/promotions` fetch via a shared context/cache.
  - Add `.catch()` error handling to the players client fetches (currently silently swallows non-2xx responses into an empty list) — flagged explicitly as a real hardening gap requiring an explicit go-ahead rather than a silent slip-in.
  - Add `priority` to the Players hero image and first 2-4 product cards (currently lazy-loaded despite being above-the-fold).
  - Re-run a full production `next build` for per-route bundle-size numbers (previously inconclusive due to local disk-space exhaustion during the diagnostic session).
- **React Native mobile app path** — `docs/PLAN.md` explicitly notes the API surface is designed for this: *"Clean REST/JSON API surface — every `/api/*` route returns JSON; a future React Native app reuses the same endpoints."* No implementation exists yet; this is an architectural intent, not a committed roadmap item.
- **POS integration is a contract-first build** — `src/app/api/pos/transaction/route.ts` is explicitly commented as *"Webhook contract for a future stadium POS to sync sales/returns... See Phase 9 spec"* — the endpoint, auth, rate-limiting, and idempotency are fully implemented and production-ready, but it's designed to receive calls from an external POS system that isn't itself part of this repo (the admin "POS Simulator" page exists specifically to test-fire calls against this contract without a real register).
- **Multi-tenant readiness** — the `Tenant` model and `tenantId` FKs on `Product`/`StoreLocation`/`Admin`/`Player` are already in the schema, with an `isDefault` flag and a `getDefaultTenantId()` helper — the data model is tenant-ready but the app currently runs as a single default tenant with no UI/flow for provisioning or switching tenants. This reads as deliberate architectural headroom for a possible future "one codebase, multiple stores" model, not a currently active initiative.
- **No items found in the codebase matching "kids-navigation" or "mlb-branding" as named backlog concepts** — see §11 below; these should not be presented as confirmed roadmap items without further clarification from the user, since no supporting code, comments, or docs reference them under those names.

---

## 11. Ambiguities / Items to Double-Check in Later Docs

- **Production database provider**: The task brief states Neon Postgres. `.env.example` and `README.md` describe the datasource generically ("any standard Postgres connection string works," naming Neon/Supabase/RDS/Railway as *examples*) and local dev explicitly uses a self-hosted Docker Postgres — I could not directly verify from the repo alone (no live DB connection inspected) that Neon specifically is the current production provider; treat this as asserted by the user/task brief, not independently confirmed from code.
- **"Kids navigation" and "MLB branding" roadmap items**: searched the codebase (git log, grep across docs and route comments) and found **no references** to these as named features, backlog items, or code comments. They may be discussed elsewhere (e.g. a task tracker, chat, or design doc not present in this repo) — do not present these as confirmed/grounded roadmap items in later docs without checking with the user first.
- **`@supabase/supabase-js` dependency**: present in `package.json` and a thin `src/lib/supabase.ts` client exists, but the app's actual data access is via Prisma direct-to-Postgres everywhere observed. It's unclear whether Supabase is used for anything live in production (e.g. as the Postgres host itself, distinct from its JS client library) or is a vestige from an earlier architecture — README mentions "Supabase Realtime" in the original P4 phase plan, but the shipped real-time mechanism found in code is a custom in-process `broadcaster` + SSE, not Supabase Realtime. Worth confirming before stating definitively in the architecture doc.
- **`AdminRole` for the "Styles" nav link vs. underlying route protection**: `AdminSidebar.tsx` shows the Styles link at `minRole: 'STAFF'`, but `middleware.ts` does not list a specific `/admin/styles` or `/api/admin/styles` restriction in `restrictedPaths` — meaning it's not explicitly gated beyond the base "any authenticated admin" check. This looks like it may be an intentional lower bar (any admin can manage styles) rather than a bug, but it's inconsistent with the MANAGER+ gating pattern used for sibling Catalog items (Categories, Brands, Gallery, Players, Promotions); flagging so a later "permissions matrix" doc doesn't accidentally overstate this as MANAGER-gated.
- **Exact production hosting details for the database** (connection pooling, region, backup policy) were not discoverable from the repository alone — these would need to come directly from the user/Vercel+DB provider dashboard, not the codebase.
- **No automated test suite exists** (§2) — if later documents claim "tested" or "QA'd," ground that specifically in the manual/scripted verification patterns actually observed (Playwright screenshots, direct API calls, `tsc`/`eslint`, and DB-level repro-before-fix verification documented in commit messages), not in an automated CI test suite, which does not exist today.
- **`HoldSettings` is modeled as a table but not obviously enforced as a true singleton** (no unique constraint forcing exactly one row) — behavior if multiple rows ever existed was not traced end-to-end (which row `getHoldSettings()` reads was not fully verified against multiple-row edge cases); low risk in practice since it's only ever admin-edited via one settings page, but noting for completeness.

---

*End of content source document. Downstream docs (project overview, user manual, UI/UX spec, deck, business value report, epilogue) should cite this file's section numbers when pulling facts, and flag to the user any claim that traces back to §11 above before publishing it as settled fact.*
