# Cloudflare R2 CORS configuration for hero-media uploads

## Why this is needed

The admin hero-media uploader (`src/app/(admin)/admin/hero-media/page.tsx`) has two upload
paths:

1. **Server-side multipart POST** (`/api/admin/hero-slides`, `POST` with `multipart/form-data`)
   — file bytes pass through the Next.js API route and are written to R2 server-side
   (`saveUploadedFile` / `saveHeroVideo` in `src/lib/media/server/upload.server.ts`). This path
   never talks to R2 from the browser, so it is **not** affected by R2 bucket CORS at all.
2. **Presigned direct-to-R2 PUT** (`/api/admin/hero-slides/presigned-url`, then a browser
   `fetch(presignedUrl, { method: 'PUT' })`) — used only for files too large to fit inside
   Vercel's serverless request body limit (~4.5 MB). The browser PUTs the file bytes directly to
   the R2 bucket's S3-compatible endpoint. This path **requires** the R2 bucket to explicitly
   allow cross-origin `PUT` requests from the app's origin(s), or the browser's CORS preflight
   (`OPTIONS`) fails before the upload ever starts.

As of this fix, path 1 is used for any file ≤ 4 MB (see `SERVER_UPLOAD_MAX_BYTES` in
`src/lib/media/upload.ts`), which covers ordinary hero images and the current hero MP4s
(~1.0–1.3 MB each). Path 2 is only reached for files larger than that, and **remains broken in
production until the bucket's CORS policy is configured** as described below.

## Vercel preview URLs rotate — this is the likely reason it broke

Every Vercel preview deploy gets a **brand-new random subdomain**
(`jayshop-retail-platform-<random>.vercel.app`) — it is not a stable identifier. Any exact-match
preview origin added to the R2 CORS allowlist therefore has a **short shelf life**: it stops
matching the moment a new preview deploy is created, even though nothing about R2 itself changed.

`scripts/configure-r2-cors.ts` already contains direct evidence of this: it lists
`jayshop-retail-platform-p0xjk09ww.vercel.app`, a preview origin from an earlier deploy that no
longer resolves to anything in use. The most plausible explanation for this bug is that CORS
*was* configured correctly once, against whatever preview URL existed at the time, direct video
upload worked — and then it silently stopped working the moment the preview URL rotated to
`jayshop-retail-platform-77cyjfa08.vercel.app` (the origin in this bug report), because the old
CORS entry no longer matched the new origin.

**The durable, non-rotating entries are the stable production domain
(`jayshop-retail-platform.vercel.app`) and any custom domain you attach.** Only rely on
preview-specific origins for as long as that specific preview deploy is in active use; expect to
re-add a new one (or re-run the config script) each time a fresh preview URL needs direct video
upload to work.

## Apply via Cloudflare dashboard

In the Cloudflare dashboard: **R2 → (bucket) → Settings → CORS Policy**, add:

```json
[
  {
    "AllowedOrigins": [
      "https://jayshop-retail-platform.vercel.app",
      "https://jayshop-retail-platform-77cyjfa08.vercel.app",
      "https://jayshop-retail-platform-*.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 300
  }
]
```

Notes:

- `https://jayshop-retail-platform.vercel.app` (stable production domain) is listed first
  because it is the one durable entry that should never need updating; everything else is
  preview-specific and expected to rotate (see above).
- `https://jayshop-retail-platform-77cyjfa08.vercel.app` is the specific deploy origin the bug
  was reported from; `https://jayshop-retail-platform-*.vercel.app` is a wildcard covering other
  Vercel preview-deploy origins (each preview deploy gets a unique subdomain). **Check whether
  your Cloudflare account's R2 CORS rules actually support `*` wildcards in `AllowedOrigins`** —
  some S3-compatible CORS implementations only support an exact match or a single `*` for the
  entire origin. If wildcards aren't honored, list each concrete preview origin you need
  explicitly, or add the stable production domain and accept that ad-hoc preview URLs won't have
  direct-PUT access (they'll still work for files ≤ 4 MB via the server-side path).
- `http://localhost:3000` covers local development (matches `NEXT_PUBLIC_APP_URL` in
  `.env.example`).
- Add your production custom domain here too if/when one is configured (`R2_PUBLIC_URL` is the
  asset-serving domain, not the app's origin — this CORS policy is about which origins may
  *upload*, keyed off the Next.js app's own URL, not `R2_PUBLIC_URL`).

## Apply via script (already in the repo)

`scripts/configure-r2-cors.ts` calls `configureR2Cors()` (`src/lib/media/r2.server.ts`) with a
hardcoded `ORIGINS` array, now updated to match the JSON above (production origin first, then the
origin from this bug report, then the stale `p0xjk09ww` preview origin kept for reference,
then localhost). Run:

```
npm run r2:configure-cors
```

This requires valid `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` /
`R2_BUCKET_NAME` credentials in the environment executing the script — these were not available
in this session (all four `R2_*` vars are unset locally), so **this script was not run as part of
this fix** and the CORS policy has not actually been applied to the bucket. Whoever has R2
dashboard/API access needs to either paste the JSON above into the dashboard, or run this script.
Because preview URLs rotate (see above), expect to revisit this `ORIGINS` array again the next
time a new preview deploy needs direct video upload to work — the production entry at the top
should never need to change.
