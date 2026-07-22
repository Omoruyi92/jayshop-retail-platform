# Jays Shop

A mobile-friendly merchandise **reservation web app** for a Toronto Blue Jays store.  
Customers browse the catalog, place a free 48-hour hold, and show a QR code when they arrive in store — no payment, no account required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| PWA | next-pwa (Workbox) |
| Database | Self-hosted PostgreSQL (Docker) + Prisma ORM |
| Auth | Phone-based identity (name + phone, no OTP in v1) |
| Real-time | Server-Sent Events via Postgres LISTEN/NOTIFY |
| Notifications | Slack Block Kit (incoming webhook) |
| Image uploads | Local filesystem + `sharp` optimization |
| QR codes | qrcode.react (client-side) |
| AI chat | OpenAI gpt-4o-mini (Birdie assistant, optional) |
| Hosting | Vercel |
| Cron | Vercel Cron — 48h hold expiry (every 15 min) |

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and other values — see inline comments in .env.example
```

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Seed Blue Jays products (14 items)

```bash
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (PWA disabled) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript type-check (no emit) |
| `npm run lint` | ESLint check |
| `npm run db:push` | Apply Prisma schema to Supabase |
| `npm run db:seed` | Seed 14 Blue Jays products |
| `npm run db:studio` | Open Prisma Studio |

---

## Phase Status

| Phase | Scope | Status |
|---|---|---|
| **P1** | Foundation — scaffold, design tokens, PWA, layout, landing page | ✅ Complete |
| **P2** | Catalog — Prisma/Supabase, admin product upload, /shop, /shop/[slug] | ⏳ Next |
| **P3** | Holds — atomic hold creation, QR receipt, /account lookup | 🔜 Pending |
| **P4** | Admin dashboard — Supabase Realtime, Slack, /admin/history + CSV | 🔜 Pending |
| **P4.5** | Reports — /admin/reports, metrics, CSV export | 🔜 Pending |
| **P5** | Expiry cron (48h) + Birdie AI chatbot | 🔜 Pending |
| **P6** | Deploy + smoke test — Vercel prod, PWA iOS/Android, E2E | 🔜 Pending |

---

## Project Structure

```
src/
├── app/
│   ├── (public)/         # Customer-facing routes
│   │   ├── page.tsx      # Landing page
│   │   ├── shop/         # /shop catalog + /shop/[slug] product detail
│   │   ├── holds/        # /holds/[reservationId] QR receipt
│   │   └── account/      # Phone-based hold lookup
│   ├── admin/            # Staff dashboard (P4)
│   └── api/              # Route handlers (holds, products, cron, chat, slack)
├── components/
│   ├── layout/           # Header, Footer, BottomNav
│   ├── shop/             # ProductCard, HoldButton
│   ├── holds/            # QRCodeDisplay
│   ├── chat/             # ChatFAB (Birdie AI)
│   └── ui/               # shadcn/ui: Button, Card, StatusChip
├── lib/
│   ├── holds/            # createHold.ts, resolveHold.ts (reservation engine)
│   ├── prisma.ts         # Prisma singleton
│   ├── supabase.ts       # Supabase client
│   ├── slack.ts          # Slack Block Kit notifications
│   └── utils.ts          # cn(), formatCAD(), generateReservationCode()
prisma/
├── schema.prisma         # Full data model (8 tables incl. HoldHistory + SalesHistory)
└── seed.ts               # 14 Blue Jays products
public/
├── manifest.json         # PWA manifest
├── brand/                # icon.svg, wordmark.svg
└── icons/                # icon-192x192.png, icon-512x512.png
```

---

## Design System

**Colours:**

| Token | Hex | Usage |
|---|---|---|
| `jays-navy` | `#134A8E` | Primary — headers, nav, CTAs |
| `jays-royal` | `#1D2D5C` | Secondary — FAQ, footer, chat header |
| `jays-red` | `#E8291C` | Accent — CTAs, prices |
| `jays-ice` | `#F0F4FA` | Page background |
| `jays-steel` | `#64748B` | Body text, labels |

**Fonts:** Oswald 600/700 (display headings) + Inter 400/500/600 (body) via `next/font/google`.

---

## Architecture Plan

See [`docs/PLAN.md`](docs/PLAN.md) for the full architecture and build plan.

---

## Deployment

1. Push repo to GitHub
2. Import to [Vercel](https://vercel.com) — auto-detects Next.js
3. Add all env vars from `.env.example` in Vercel project settings
4. Point `DATABASE_URL` at your production Postgres instance, run `npm run db:push`
5. Verify PWA installs on Chrome Android + iOS Safari
