# Jays Shop

A mobile-friendly merchandise **reservation web app** for a Toronto Blue Jays store.
Customers browse the catalog, place a free 48-hour hold, and show a QR code when they
arrive in store — no payment, no customer account required. Staff manage everything
from a role-based admin dashboard.

**Live demo:** [jayshop-retail-platform.vercel.app](https://jayshop-retail-platform.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| PWA | next-pwa (Workbox) |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth (credentials, bcrypt password hashing, session middleware) |
| Authorization | Role-based access control (`AdminRole`: ADMIN / STAFF) |
| Real-time | Server-Sent Events via Postgres LISTEN/NOTIFY |
| Notifications | Slack Block Kit (incoming webhook + interactive buttons) |
| Media | Local filesystem + `sharp` optimization; optional Cloudflare R2 backend |
| QR codes | qrcode.react (client-side) |
| AI chat | OpenAI gpt-4o-mini ("Birdie" assistant, optional, rule-based fallback) |
| Hosting | Vercel + Vercel Cron (48h hold expiry) |

---

## Features

- **Product catalog** — browse by brand, player, category; product detail pages; hero slides and videos
- **48-hour holds** — atomic hold creation, QR-code receipt, automatic expiry via cron, hold lookup by phone
- **Admin dashboard** — inventory management, hold queue, printable hold tags, reports with CSV export, POS view
- **Role-based access control** — separate ADMIN and STAFF roles enforced in middleware and API handlers
- **Slack notifications** — new-hold alerts with interactive Mark-Picked-Up / Release buttons
- **Birdie AI chat** — customer-facing assistant grounded in the live catalog (optional; works without an API key using canned replies)
- **PWA** — installable on iOS/Android with offline shell
- **Flexible media storage** — local filesystem in dev, Cloudflare R2 in production

---

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL 16** — either a local install, or Docker via the included
  `docker-compose.yml` (recommended; runs Postgres in a container)
- **Docker** (optional, only if using `docker-compose.yml` for the database)

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd jays-shop
```

### 2. Install dependencies

```bash
npm install
```

(This also runs `prisma generate` via the `postinstall` script.)

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`. Only these are required for local development:

- `DATABASE_URL` — matches `docker-compose.yml` by default: `postgresql://jays:jays@localhost:5432/jays_shop`
- `NEXTAUTH_URL` — `http://localhost:3000`
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000`
- `CRON_SECRET` — any random string for local use

Everything else (OpenAI, Slack, Cloudflare R2, Supabase) is **optional** — the app
degrades gracefully to local media storage and rule-based chat replies without them.
See the inline comments in `.env.example` for details.

### 4. Start PostgreSQL

Using Docker (recommended):

```bash
docker compose up -d
```

Or point `DATABASE_URL` at any existing Postgres 14+ instance.

### 5. Create the database schema

```bash
npx prisma db push
npx prisma generate
```

### 6. Seed products and create an admin user

```bash
SEED_ADMIN_PASSWORD=your-local-password npm run db:seed
```

This seeds the Blue Jays product catalog and creates the initial admin account.
The password you pass is bcrypt-hashed before storage and is never committed.

### 7. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Admin Access

| | |
|---|---|
| URL | [http://localhost:3000/admin](http://localhost:3000/admin) |
| Email | `admin@jays.shop` |
| Password | the `SEED_ADMIN_PASSWORD` you used in step 6 |

Additional staff accounts can be created from the admin dashboard.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint check |
| `npm run db:push` | Apply Prisma schema to the database |
| `npm run db:seed` | Seed products + initial admin (requires `SEED_ADMIN_PASSWORD`) |
| `npm run db:studio` | Open Prisma Studio |

---

## Project Structure

```
src/
├── app/
│   ├── (public)/         # Customer-facing routes (landing, shop, holds, account)
│   ├── (admin)/          # Staff dashboard (role-gated)
│   └── api/              # Route handlers (holds, products, cron, chat, slack, admin)
├── components/           # Layout, shop, holds, admin, chat, ui (shadcn)
├── hooks/                # Admin session, current admin, etc.
├── lib/                  # Holds engine, auth, prisma, slack, media, utils
└── middleware.ts         # Auth + RBAC enforcement
prisma/
├── schema.prisma         # Data model (products, holds, history, admins, settings)
└── seed.ts               # Catalog seed + initial admin creation
```

---

## Screenshots

> TODO: add screenshots of the landing page, catalog, hold QR receipt, and admin
> dashboard here. Suggested paths: `docs/screenshots/landing.png`,
> `docs/screenshots/shop.png`, `docs/screenshots/hold-qr.png`,
> `docs/screenshots/admin.png`.

---

## Deployment (Vercel)

1. Push the repo to GitHub and import it into [Vercel](https://vercel.com) (auto-detects Next.js)
2. Add all environment variables from `.env.example` in the Vercel project settings
3. Point `DATABASE_URL` at a managed Postgres instance (Neon, Supabase, RDS, etc.)
4. Run `npx prisma db push` against the production database
5. Set `CRON_SECRET` and configure the hold-expiry cron schedule (see `vercel.json`)

---

## Notes

- `.env`, `.env.local`, and all local env files are gitignored — never commit real secrets.
- The full architecture and build plan lives in [`docs/PLAN.md`](docs/PLAN.md).
