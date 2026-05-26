# Jays Shop — Project Documentation

**Merchandise Reservation System for Toronto Blue Jays Store**

---

## Executive Summary

Jays Shop is a mobile-first web application that enables customers to browse merchandise, place free 48-hour holds, and pick up items in-store using a QR code — all without requiring payment or account creation. The system includes a comprehensive admin dashboard for staff to manage holds, track inventory, and generate reports.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Key Features](#key-features)
4. [User Flows](#user-flows)
5. [Technical Architecture](#technical-architecture)
6. [Business Impact](#business-impact)
7. [Future Roadmap](#future-roadmap)

---

## Problem Statement

The Toronto Blue Jays store faced several operational challenges:

- **No reservation system**: Customers couldn't hold items before visiting, leading to missed sales when popular items sold out
- **Manual tracking**: Staff managed holds via phone calls and paper notes, creating confusion and double-booking
- **Inventory opacity**: No real-time visibility into what was held vs. available
- **Poor customer experience**: Customers arrived to find their desired items already sold

---

## Solution Overview

Jays Shop provides a complete digital reservation platform with two primary interfaces:

### Customer-Facing (Public)
- Browse the product catalog with category filters
- View product details with real-time availability status
- Place holds with name and phone number (no account required)
- Receive a QR code receipt for in-store pickup
- Look up existing holds by phone number

### Staff-Facing (Admin)
- Secure login with role-based access
- Live dashboard showing active holds and alerts
- Manage holds: confirm full/partial pickup or release
- View complete hold history and sales history
- Export CSV reports for analysis
- Product management: add, edit, archive products

---

## Key Features

### Customer Features
| Feature | Description |
|---------|-------------|
| Product Catalog | Browse all merchandise with images, prices, and availability |
| Category Filters | Filter by category (jerseys, hats, accessories, etc.) |
| Hold Placement | Free 48-hour hold with automatic expiry |
| QR Code Receipt | Unique reservation code with scannable QR code |
| Order Lookup | Retrieve hold details using phone number |
| PWA Support | Installable as a mobile app on iOS/Android |

### Admin Features
| Feature | Description |
|---------|-------------|
| Live Dashboard | Real-time view of active holds with expiry alerts |
| Hold Management | Confirm pickup (full or partial), release, or extend |
| History Tracking | Complete audit trail of all hold transactions |
| Sales Reports | Metrics, analytics, and CSV export |
| Product CRUD | Add, edit, archive, and manage product inventory |
| Slack Integration | Automatic notifications for new holds |

### System Features
| Feature | Description |
|---------|-------------|
| Atomic Transactions | Prevents race conditions and double-booking |
| Auto-Expiry Cron | Releases holds automatically after 48 hours |
| Audit Logging | Every action logged with timestamp and actor |
| AI Chatbot | Birdie assistant for customer support |
| CSV Export | History and reports exportable for analysis |

---

## User Flows

### Customer Journey

```
1. Visit jays-shop.vercel.app
2. Browse /shop catalog
3. Click product → view details
4. Select quantity → click "Hold"
5. Enter name + phone → submit
6. Receive QR code receipt
7. Visit store → show QR code
8. Staff confirms pickup
```

### Admin Journey

```
1. Login at /admin/login
2. View dashboard → see active holds
3. Navigate to /admin/holds
4. Locate customer hold
5. Click "Pick Up" → enter quantity
6. Confirm → inventory updates
7. Check /admin/history for record
```

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui components |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Authentication | NextAuth with bcrypt password hashing |
| QR Codes | qrcode.react (client-side generation) |
| PWA | next-pwa with Workbox |
| AI Chat | OpenAI GPT-4o-mini (Birdie assistant) |
| Notifications | Slack Block Kit webhooks |
| Hosting | Vercel (frontend) + Supabase (database) |
| Cron Jobs | Vercel Cron (48h expiry) |

### Database Schema

**Core Tables:**
- `Product` — merchandise catalog with inventory counters
- `Customer` — phone-based identity (no accounts)
- `Hold` — reservation records with status tracking
- `Admin` — staff accounts with role-based access
- `HoldHistory` — immutable snapshot of resolved holds
- `SalesHistory` — transaction records for reporting
- `AuditLog` — complete action audit trail

**Key Design Decisions:**
- `heldQuantity` and `pickedQuantity` counters on Product for real-time availability
- Atomic transactions prevent race conditions during hold creation
- History tables store snapshots (not references) for data integrity
- 48-hour expiry via cron job with Slack notifications

---

## Business Impact

### Immediate Benefits
- **Reduced lost sales**: Customers can reserve items before visiting
- **Improved operations**: Centralized dashboard replaces manual tracking
- **Better customer experience**: No more arriving to find items sold out
- **Data visibility**: Sales history and analytics for management

### Efficiency Gains
- Staff no longer manually track holds via phone/paper
- Automatic inventory synchronization prevents overselling
- QR code pickup reduces checkout time
- CSV exports simplify reporting

### Scalability
- PWA support means customers can "install" the app
- Atomic transactions handle high-traffic periods
- Modular architecture supports future features

---

## Future Roadmap

### Phase 1 — Foundation (Complete)
- Scaffold, design tokens, PWA, layout, landing page

### Phase 2 — Catalog (Complete)
- Prisma schema, product CRUD, /shop, /shop/[slug]

### Phase 3 — Holds (Complete)
- Atomic hold creation, QR receipt, /account lookup

### Phase 4 — Admin Dashboard (Complete)
- Live feed, Slack integration, /admin/history + CSV export

### Phase 4.5 — Reports (Complete)
- /admin/reports metrics + CSV

### Phase 5 — Expiry + AI (Complete)
- 48h auto-expiry cron, Birdie AI chatbot

### Phase 6 — Production Deploy (Next)
- Vercel production deploy
- PWA smoke test on iOS/Android
- End-to-end testing
- Performance optimization

### Future Enhancements
- Payment integration (pre-pay for holds)
- SMS notifications for expiry reminders
- Multi-location support
- Customer loyalty program
- Advanced analytics dashboard

---

## Demo Information

### Startup
```bash
npm run clean-start
```
App available at http://localhost:3000

### Admin Login
| Field | Value |
|-------|-------|
| URL | http://localhost:3000/admin/login |
| Email | any (e.g., admin@demo.com) |
| Password | any (e.g., demo) |

> Dev mode accepts any credentials for demonstration purposes.

### Demo Flow
1. **Public**: Browse /shop → place a hold → receive QR code
2. **Admin**: Login → /admin/holds → confirm pickup
3. **Admin**: /admin/history → verify record
4. **Admin**: /admin/products → check inventory updated
5. **Dashboard**: Confirm active hold count decreased

---

## Known Limitations

| Area | Detail |
|------|--------|
| Auth | Dev mode accepts any credentials — intentional for demo |
| Slack | Stub only — requires SLACK_WEBHOOK_URL in .env |
| Cloudinary | Image uploads use local fallback |
| Supabase | Dashboard polls every 5s (no WebSocket) |
| Database | SQLite path is absolute (machine-specific) |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| DB / Prisma error | `npm run db:reset && npm run db:seed` |
| Port 3000 in use | `npm run clean-start` |
| Module error | `rm -rf .next && npm run dev` |
| Prisma out of sync | `npx prisma generate && npm run dev` |

---

## Contact

For questions or feedback about Jays Shop, refer to the project repository or contact the development team.

---

*Document generated for manager presentation. Jays Shop — Toronto Blue Jays Merchandise Reservation System.*
