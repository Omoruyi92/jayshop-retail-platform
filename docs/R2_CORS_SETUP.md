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
hardcoded origin list. It currently only lists an older preview URL
(`jayshop-retail-platform-p0xjk09ww.vercel.app`), not the current one from this bug report. Update
the `ORIGINS` array in that script to match the JSON above, then run:

```
npm run r2:configure-cors
```

This requires valid `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` /
`R2_BUCKET_NAME` credentials in the environment executing the script — these were not available
in this session (all four `R2_*` vars are unset locally), so **this script was not run as part of
this fix** and the CORS policy has not actually been applied to the bucket. Whoever has R2
dashboard/API access needs to either paste the JSON above into the dashboard, or update and run
this script.
