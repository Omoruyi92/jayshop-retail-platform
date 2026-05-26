# Jays Shop — Demo Reference Card

## Startup

```bash
npm run clean-start
```

Kills any existing process on `:3000`, then launches the Next.js dev server.
App is available at **http://localhost:3000**.

---

## Admin Login

| Field    | Value                          |
|----------|-------------------------------|
| URL      | http://localhost:3000/admin/login |
| Email    | `admin@jays.shop`             |
| Password | `Bluejays2026`                |

> Seeded credentials above are required after running `npm run db:seed`. In dev mode, any email/password is accepted if no admin record exists yet.

---

## New Features (Sprint 2)

Six features were added on top of the original launch:

| # | Feature | Where to demo |
|---|---------|---------------|
| 1 | **Language Switcher (EN / FR / ES)** | Header — pill buttons on desktop, dropdown on mobile |
| 2 | **Brand Filtering** | `/shop` — brand pill row appears when a category is selected |
| 3 | **Live Search Bar** | `/shop` — sticky search bar above the filter pills (250 ms debounce) |
| 4 | **Stadium Hold Option** | Hold form — second radio option (24-hr expiry, priority queue) |
| 5 | **Admin Stadium Queue Tab** | `/admin/holds` — "⚾ Stadium Queue" tab, sorted by pickup ETA |
| 6 | **Brand on Product Detail** | `/shop/<slug>` — brand name shown below price |

## New Features (Sprint 3)

One enhancement added on top of Sprint 2:

| # | Feature | Where to demo |
|---|---------|---------------|
| 7 | **Size-Level Inventory** | `/shop/<slug>` — per-size availability; OOS sizes shown greyed/disabled in hold form |

### Size-Level Inventory Details

- **Schema**: `SizeInventory` table tracks `quantity` and `heldQuantity` per `(productId, size)` pair.
- **API**: `GET /api/products/[slug]/sizes` returns `{ hasSizeInventory, sizes: [{ size, available }] }`.
- **Hold form**: OOS sizes rendered with `opacity-40 cursor-not-allowed line-through`; selecting an OOS size is blocked client-side and server-side (`SIZE_NOT_AVAILABLE` error).
- **Hold creation**: `createHold` atomically increments `SizeInventory.heldQuantity` inside the same Prisma transaction that increments `Product.heldQuantity`.
- **Graceful degradation**: Products without `SizeInventory` rows continue to work exactly as before — size-level check is skipped.

---

## Demo Flow

### Step 1 — Public: Browse shop with new filters
1. Open http://localhost:3000/shop
2. Toggle language in the header: click **FR** → page UI switches to French; click **ES** → Spanish; back to **EN**.
3. Type in the **Search Bar** (e.g. "nike" or "jersey") — product grid filters in real-time.
4. Click a category pill (e.g. **Men**) — subcategory and **brand** pill rows appear below.
5. Click a brand pill (e.g. **Nike**) — grid narrows to that brand only.
6. Clear search and filters before the next step.

### Step 2 — Public: Place a Stadium Hold
1. Click any product → product detail page opens.
2. Confirm the **brand name** appears below the price (e.g. "NIKE").
3. Click **Hold This Item — Free**.
4. In the hold form, select **"Watching Game at Stadium/Ballpark"** — amber alert banner appears, noting 24-hr expiry and priority queue.
5. Fill in name and phone; click **Confirm Hold**.
6. Hold confirmation screen appears with QR code — note the reservation code.

### Step 2b — Public: Size-Level Inventory (OOS Sizes)
1. Navigate to a product that has sizes (e.g. a jersey or apparel item).
2. Click **Hold This Item — Free** — the size selector appears.
3. Any size with zero available stock is shown **greyed out with strikethrough** and cannot be clicked.
4. Attempting to submit the form with an OOS size (via keyboard) shows a toast: *"This size is currently out of stock"*.
5. Select an available size, fill name and phone, and confirm — hold is placed normally.
6. Switch language (FR or ES) — size OOS legend and error toasts update to the selected language.

### Step 3 — Admin: Stadium Queue tab
1. Log in at http://localhost:3000/admin/login.
2. Navigate to **Holds** (http://localhost:3000/admin/holds).
3. Click the **⚾ Stadium Queue** tab — it shows only active stadium holds, sorted by `pickupQueueAt` (earliest first), with a queue-position badge and Pickup ETA column.
4. In the **All Holds** tab, stadium holds are flagged with a `⚾` badge next to the reservation code and a "Stadium" type pill.

### Step 4 — Admin: Holds page → Pick Up
1. Still on `/admin/holds`, switch back to the **All Holds** tab.
2. Locate the hold from Step 2.
3. Click **Pick Up** → modal opens.
4. Enter a quantity (partial or full) and confirm.
5. Row status updates to `PICKED_UP`.

### Step 5 — Admin: History page → confirm resolved hold appears
1. Navigate to **History** (http://localhost:3000/admin/history).
2. Confirm the resolved hold row is present with correct columns:
   - Reservation ID, customer name, product, quantity, status, timestamp.

### Step 6 — Admin: Products page → verify heldQuantity updated
1. Navigate to **Products** (http://localhost:3000/admin/products).
2. Locate the product from Step 2.
3. Confirm `heldQuantity` reflects the quantity that was picked up.

### Step 7 — Dashboard: confirm active hold count live
1. Navigate to **Dashboard** (http://localhost:3000/admin).
2. Confirm the **Active Holds** counter has decreased by 1 (dashboard polls every 5 s).

---

## Database Scripts

| Script | Purpose |
|--------|---------|
| `npm run db:reset` | Wipes and re-seeds data (keeps schema) — safe for demo resets |
| `npm run db:reset-full` | Drops DB, re-applies migrations, re-seeds — full clean slate |
| `npm run db:seed` | Seeds data only (idempotent) |
| `npm run db:studio` | Opens Prisma Studio at http://localhost:5555 |

---

## Known Limitations

| Area | Detail |
|------|--------|
| **Auth** | Dev mode accepts any credentials — intentional for demo. |
| **Slack** | Stub only — no real webhook fires unless `SLACK_WEBHOOK_URL` is set in `.env.local`. |
| **Cloudinary** | Image uploads fall back to local `/public/uploads` — Cloudinary not required for demo. |
| **Supabase Realtime** | Dashboard polls every 5 s via HTTP; no WebSocket/Realtime connection is required. |
| **SQLite DB path** | `prisma/dev.db` is a local file — the app only runs on the machine where it was seeded. |
| **Language persistence** | Locale is stored in `localStorage`; it resets if the browser storage is cleared. |
| **Brand pills** | Only appear when a non-"All" category is selected; brands are derived from the seeded products. |
| **Size-level inventory** | Only enforced for products that have `SizeInventory` rows. Products seeded without size rows fall back to product-level inventory automatically. |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| DB / Prisma data error | `npm run db:reset` |
| Full reset needed | `npm run db:reset-full` |
| Port 3000 already in use | `npm run clean-start` (kills `:3000` automatically) |
| Module / build error | `rm -rf .next && npm run dev` |
| Prisma client out of sync | `npx prisma generate && npm run dev` |

---

## Official 12-Step Demo Flow (Smoke Test)

Run through these 12 steps in order to verify the full user and admin journey.

| # | Step | What to verify |
|---|------|----------------|
| 1 | Open **http://localhost:3000** (landing page `/`) | Page loads; hero, How It Works, FAQ sections visible; language toggle in header is present |
| 2 | Navigate to **http://localhost:3000/shop** | Products grid loads with ≥8 items; search bar visible; category/subcategory/brand dropdowns present |
| 3 | Type "jersey" in the search bar | Grid filters in real-time (≤250 ms debounce); result count updates |
| 4 | Click any product → `/shop/[slug]` | Product detail page loads with image, name, price, brand, and hold form |
| 5 | Select a size (if applicable) and submit the hold form | Hold confirmation screen appears with a **reservation code** (format `JS-XXXXX`, uppercase, no ambiguous characters) and a QR code |
| 6 | Go to **http://localhost:3000/my-holds** → enter the phone number used in step 5 | Hold card appears with correct status (`ACTIVE`), product name, and reservation code |
| 7 | Log into **http://localhost:3000/admin/login** with `admin@jays.shop` / `Bluejays2026` | Redirects to `/admin` dashboard; active hold counter reflects the new hold |
| 8 | Navigate to **http://localhost:3000/admin/holds** → find the hold from step 5 → click **Pick Up** → enter a quantity less than the hold quantity → confirm | Toast confirms partial pickup; a new hold is auto-created for the remaining quantity; original row status → `PICKED_UP` |
| 9 | Locate the new residual hold → click **Pick Up** → confirm full quantity | Row status → `PICKED_UP`; hold no longer appears in active-holds list |
| 10 | Navigate to **http://localhost:3000/admin/products** → click **+ Add Product** → fill in the form → click **Add Product** | Success toast fires; new product row appears in the table immediately |
| 11 | Return to **http://localhost:3000/shop** | New product is visible in the grid (page polls every 10 s; refresh if needed) |
| 12 | Toggle language to **FR** in the header → verify UI strings update; toggle to **ES** → verify again | All navigation labels, headings, and filter text update to the selected language; toggling back to **EN** restores English |

### Pass Criteria
- All 12 steps complete without a browser console error
- No broken images at any step
- No placeholder text visible in any page
- `tsc --noEmit` exits 0
- `npm run build` produces exactly 27/27 pages

---

## Legacy Smoke Test Checklist

| # | Check | Method | Result |
|---|-------|--------|--------|
| 1 | `npm run clean-start` — app opens on `:3000`, no terminal errors | Manual | — |
| 2 | `/admin/login` — loads (200), login with seeded credentials redirects to `/admin` | HTTP + Browser | — |
| 3 | `/admin` — dashboard loads, active holds count visible | HTTP 307 → 200 after login | — |
| 4 | `/shop` — products grid loads, categories visible | HTTP 200 | — |
| 5 | Header language pills (EN/FR/ES) — switching locale updates all visible strings | Browser | — |
| 6 | Search bar — typing filters the product grid in real-time (≤250 ms) | Browser | — |
| 7 | Category + brand pills — selecting Men shows brand row; selecting Nike narrows grid | Browser | — |
| 8 | Product detail — brand name displayed below price | Browser | — |
| 9 | Hold form — Stadium Hold radio option present with amber alert on select | Browser | — |
| 10 | Place a stadium hold — confirmation + QR code displayed | Browser | — |
| 11 | `/admin/holds` — Stadium Queue tab visible, shows stadium holds with queue position | Browser | — |
| 12 | Pick Up from All Holds tab — row status → `PICKED_UP` | Browser | — |
| 13 | `/admin/history` — resolved hold row present, columns correct | Browser | — |
| 14 | `/admin/products` — `heldQuantity` updated after pickup | Browser | — |
| 15 | `/admin/reports` — page loads without error | HTTP 307 → 200 after login | — |
| 16 | Mobile (375 px) — language dropdown, search bar, filters, hold form all usable | Browser DevTools | — |
| 17 | Size-level inventory — OOS sizes greyed/disabled in hold form on a sized product | Browser | — |
| 18 | Language switch — OOS size legend and toast strings update in FR and ES | Browser | — |
| 19 | Hold without size (no-size product) — still works, no regression | Browser | — |
| 20 | `GET /api/products/[slug]/sizes` — returns `{ hasSizeInventory, sizes }` for a seeded product | HTTP | — |

> Items 5–20 require an authenticated browser session for admin steps. HTTP-only checks confirm pages respond; interactive flows must be verified manually in a browser.
