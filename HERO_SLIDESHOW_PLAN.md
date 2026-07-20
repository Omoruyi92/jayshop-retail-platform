# Hero Slideshow & User Submission Feature Plan

## 1. Goal
Enable admin-managed image/video slideshows independently on the **Home hero** and **Shop hero** while preserving the existing default gradient backgrounds. Allow users to submit up to 2 photos from the "How Others Are Wearing It" gallery; admin reviews/approves submissions; approved user submissions open in a popup with captions and details when clicked.

---

## 2. Prisma Schema Changes

### 2.1 New model: `HeroSlide`
Stores admin-uploaded media per hero scope.

```prisma
model HeroSlide {
  id        String   @id @default(cuid())
  scope     String   // "HOME" | "SHOP"
  type      String   // "IMAGE" | "VIDEO"
  url       String   // absolute path or external URL
  title     String?
  caption   String?
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([scope, isActive, sortOrder])
  @@index([scope, sortOrder])
}
```

### 2.2 New model: `CustomerStyleSubmission`
Groups up to 2 user images as one folder/profile entry.

```prisma
model CustomerStyleSubmission {
  id              String   @id @default(cuid())
  customerId      String?  // optional link to Customer
  customerName    String?
  instagramHandle String?
  caption         String?
  status          String   @default("PENDING") // PENDING | APPROVED | REJECTED
  reviewedBy      String?
  reviewedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  images CustomerStyleImage[]

  @@index([status, createdAt])
  @@index([customerId])
}

model CustomerStyleImage {
  id        String @id @default(cuid())
  submissionId String
  imageUrl  String
  caption   String?
  sortOrder Int    @default(0)

  submission CustomerStyleSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([submissionId, sortOrder])
}
```

### 2.3 Migration command
```bash
npx prisma db push
```
No seed data required; admin creates slides after deployment.

---

## 3. API Routes

### 3.1 Admin slide management
- `GET    /api/admin/hero-slides?scope=HOME|SHOP` — list slides for scope.
- `POST   /api/admin/hero-slides` — create slide (FormData: scope, type, file, title, caption, sortOrder).
- `PATCH  /api/admin/hero-slides/[id]` — update metadata (title, caption, sortOrder, isActive).
- `DELETE /api/admin/hero-slides/[id]` — delete slide and file.
- `POST   /api/admin/hero-slides/reorder` — bulk update sortOrder.

### 3.2 User submissions
- `POST   /api/customer-style-submissions` — user uploads up to 2 images, caption, name, instagram handle. Creates `PENDING` folder.
- `GET    /api/admin/customer-style-submissions` — list pending/approved/rejected.
- `PATCH  /api/admin/customer-style-submissions/[id]` — approve/reject, set reviewer.
- `DELETE /api/admin/customer-style-submissions/[id]` — delete submission and files.

### 3.3 Public endpoints
- `GET    /api/hero-slides?scope=HOME|SHOP` — active slides only, ordered by sortOrder.
- `GET    /api/customer-style-submissions/approved` — approved submissions with images.

---

## 4. File Storage

Use the existing project pattern found in `/src/app/api/customer-photos/route.ts`:

- Write files to `public/uploads/hero-slides/` and `public/uploads/customer-style-submissions/`.
- Use `nanoid(10)` for filenames.
- Validate MIME types and file size.
- Store public URL path (e.g. `/uploads/hero-slides/abc123.png`).

No R2/S3 configuration is currently present; keep local filesystem storage consistent with CustomerPhoto uploads.

---

## 5. Admin UI

### 5.1 Sidebar
Add under **Catalog** or **Community** group:
```ts
{ href: '/admin/hero-media', label: 'Hero Media', icon: ImageIcon, minRole: 'MANAGER' }
```

### 5.2 Page: `/admin/hero-media`
- Two tabs: **Home Hero** and **Shop Hero**.
- Each tab shows a sortable table/list of slides:
  - preview thumbnail / video badge
  - title, caption, type, sort order, active toggle
  - edit metadata inline or modal
  - delete with confirmation
- Drag-and-drop reorder (optional; initial version can use up/down arrows + sortOrder input).
- Upload area: accept image/video, select scope automatically by active tab.

### 5.3 Submissions panel
Either a separate tab on the same page (`/admin/hero-media/submissions`) or a new page `/admin/customer-style-submissions`.
- Columns: submitted at, customer name, images (thumbnails), caption, status.
- Actions: preview, approve, reject, delete.
- Bulk approve/reject (optional).

---

## 6. Customer UI

### 6.1 Home hero (`src/app/(public)/page.tsx`)
- Extract hero into a reusable `HomeHero` client component.
- Fetch active HOME slides from `/api/hero-slides?scope=HOME`.
- Keep existing default background elements (gradient, watermarks, glow orbs).
- Render slideshow as an **overlay** on top of the default background:
  - Fade or slide transition between media.
  - For video: autoplay muted loop.
  - Overlay text/content must remain readable; slides sit behind the hero copy.
- If no active slides, default background/content displays unchanged.

### 6.2 Shop hero (`src/components/shop/ShopHero.tsx`)
- Convert to client component if not already.
- Fetch active SHOP slides from `/api/hero-slides?scope=SHOP`.
- Render slideshow overlay on the existing gradient background.
- Keep mascot, search bar, and live pulse unchanged.

### 6.3 User upload in "How Others Are Wearing It"
- In `src/components/shop/ProductDetails.tsx`, update the existing customer photo upload flow to allow up to 2 images and create a `CustomerStyleSubmission` instead of a single `CustomerPhoto`.
- Keep the upload modal UI but add a second image slot.
- Show pending state message after submit.

### 6.4 Popup / lightbox
- When an approved submission image is clicked in the gallery:
  - Open a modal/lightbox.
  - Display both submission images with captions.
  - Show customer name, instagram handle, and caption.
  - Use existing Dialog component or a new Lightbox component.

---

## 7. Component Plan

New files:
- `src/components/hero/HeroSlideshow.tsx` — reusable image/video slideshow overlay.
- `src/components/hero/HomeHero.tsx` — extracted home hero with slideshow.
- `src/components/hero/ShopHero.tsx` — extracted shop hero with slideshow.
- `src/app/(admin)/admin/hero-media/page.tsx` — admin media page.
- `src/app/api/admin/hero-slides/route.ts` and `[id]/route.ts`.
- `src/app/api/hero-slides/route.ts`.
- `src/app/api/customer-style-submissions/route.ts`.
- `src/app/api/admin/customer-style-submissions/route.ts` and `[id]/route.ts`.
- `src/app/api/customer-style-submissions/approved/route.ts`.
- `src/components/shop/CustomerStyleGallery.tsx` — gallery + upload + lightbox.

Updated files:
- `src/app/(public)/page.tsx` — replace inline hero with `<HomeHero />`.
- `src/app/(public)/shop/page.tsx` — pass ShopHero or integrate `<ShopHero />`.
- `src/components/shop/ProductDetails.tsx` — replace CustomerPhoto upload/gallery with `CustomerStyleGallery`.
- `src/components/admin/AdminSidebar.tsx` — add Hero Media link.
- `prisma/schema.prisma` — add new models.

---

## 8. RBAC
- Admin slide CRUD: `MANAGER` minimum.
- Submission review: `STAFF` minimum.
- Public endpoints: no auth.

---

## 9. Testing Checklist

- [ ] `npx prisma db push` succeeds with no errors.
- [ ] Admin can upload image and video slides for Home and Shop independently.
- [ ] Active/inactive toggle hides/shows slides on customer side.
- [ ] Reordering updates customer-side display order.
- [ ] Home and Shop heroes each show only their scoped slides.
- [ ] Existing default backgrounds still render behind the slideshow.
- [ ] User can submit 1 or 2 images from the PDP gallery.
- [ ] Submission appears in admin panel as PENDING.
- [ ] After approval, submission appears in the gallery.
- [ ] Clicking an approved image opens the popup with details.
- [ ] Rejected submissions do not appear on customer side.
- [ ] TypeScript and ESLint pass.
- [ ] Production build succeeds.

---

## 10. Rollback Plan

1. Revert the schema changes by removing `HeroSlide`, `CustomerStyleSubmission`, and `CustomerStyleImage` models.
2. Run `npx prisma db push` to drop the tables.
3. Delete uploaded files under `public/uploads/hero-slides/` and `public/uploads/customer-style-submissions/`.
4. Revert code changes via git:
   ```bash
   git revert <feature-commit>
   ```
5. If only partial rollback is needed, toggle `isActive` to `false` for all slides in the admin panel to disable the slideshow without removing code.

---

## 11. Open Questions

- Should video slides have a fallback poster image, or is the first frame acceptable?
- Should the popup display all images of a submission at once or as a carousel?
- Do we need email/notification to users when their submission is approved or rejected?
