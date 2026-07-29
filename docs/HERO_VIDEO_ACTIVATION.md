# Activating the two committed HOME hero videos (no R2 upload needed)

## TL;DR

`HeroSlide.url` / `HeroSlide.mobileUrl` are plain `String` columns with **no
origin/format validation** anywhere in the code path (Prisma schema, the
`POST /api/admin/hero-slides` validator, or the `HeroSlideshow.tsx` renderer).
A site-relative path like `/hero-videos/home/home-desktop.mp4` works exactly
like the existing `/uploads/hero-slides/...` image paths already stored for
other slides.

Because `public/hero-videos/home/home-desktop.mp4` and
`public/hero-videos/home/home-mobile.mp4` are committed to git, they are
baked into every Vercel build and served directly by the app at:

- `https://jayshop-retail-platform.vercel.app/hero-videos/home/home-desktop.mp4`
- `https://jayshop-retail-platform.vercel.app/hero-videos/home/home-mobile.mp4`

**No R2 upload is required to use these two files as a hero slide.**

Evidence for this conclusion:

- `src/lib/media/upload.ts` — `isStaticHeroVideo(url)` matches
  `url.startsWith('/hero-videos/')` as an already-recognized, first-class URL
  shape (used by `deleteUploadedFile` in `src/lib/media/server/upload.server.ts`).
- `scripts/migrate-hero-videos-to-static.ts` — an existing one-time migration
  script whose entire purpose is to move hero videos from R2/Blob URLs *to*
  this exact static `/hero-videos/<scope>/<file>` shape and write that path
  straight into `HeroSlide.url`.
- `src/components/shop/HeroSlideshow.tsx` — renders `slide.url` /
  `slide.mobileUrl` directly as the `<video>`/`<source>` `src` with no origin
  check, the same way it already renders relative `/uploads/...` image paths.
- `src/app/api/admin/hero-slides/route.ts` (`isValidCreateSlideBody`) — only
  requires `typeof body.url === 'string'`. No prefix, host, or R2 check.

## One important gap: there is currently no way to set `mobileUrl`

`CreateSlideBody` (the JSON body accepted by `POST /api/admin/hero-slides`)
only has `scope`, `url`, `mediaType`, and `altText` — **it does not accept
`mobileUrl`**, and `PATCH` (`isValidUpdateSlideBody`) doesn't accept it
either. The admin UI (`/admin/hero-media`) also has no manual-URL input; it
only supports file uploads, which always re-encode/re-save bytes rather than
pointing at an existing static path.

So today, a new slide can be created pointing at `home-desktop.mp4` via
`url`, but **`mobileUrl` cannot be set through any existing API or UI path**
without a small code change to `CreateSlideBody` /
`isValidCreateSlideBody` (and optionally `isValidUpdateSlideBody`) to accept
an optional `mobileUrl: string` field. That is an application-code change
only — the `mobileUrl` column already exists in the schema, so **no Prisma
migration is needed** to close this gap.

## Exact steps to activate the desktop video today (no code change)

1. Get an authenticated admin session cookie by logging in at
   `https://jayshop-retail-platform.vercel.app/admin/login`.
2. Send a JSON `POST` to `/api/admin/hero-slides` with the admin session
   cookie attached:

   ```
   POST https://jayshop-retail-platform.vercel.app/api/admin/hero-slides
   Content-Type: application/json

   {
     "scope": "HOME",
     "mediaType": "VIDEO",
     "url": "/hero-videos/home/home-desktop.mp4",
     "altText": "Jays Shop hero video"
   }
   ```

3. This creates a new `HeroSlide` row with `scope=HOME`, `mediaType=VIDEO`,
   `url=/hero-videos/home/home-desktop.mp4`, `mobileUrl=null`, `active=true`.
   The route automatically calls `revalidatePath('/')`, so the homepage
   picks it up immediately — no redeploy needed.
4. Without `mobileUrl` set, `HeroSlideshow.tsx` will fall back to using
   `url` (the desktop video) on all viewports, including mobile.

## To get the mobile-specific video (`home-mobile.mp4`) wired up too

This requires the small code change described above (add `mobileUrl` to
`CreateSlideBody`/`isValidCreateSlideBody`, and to the `PATCH` update body if
you want to set it after the fact on an existing slide). Once that shape
accepts it, the same JSON `POST` (or a follow-up `PATCH`) can include:

```
"mobileUrl": "/hero-videos/home/home-mobile.mp4"
```

No R2 upload, no Prisma migration, and no schema change is needed for this
either — only extending the two validator functions to pass through a field
that already exists on the model.
