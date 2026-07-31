Mobile hero tradeoff, stated plainly: with these `1920x1080` sources, a taller portrait hero needs more vertical fill, so **full-viewport portrait height and a mostly-crisp video frame are mutually exclusive unless we crop the source narrower than full width**.

# Mobile hero video safe-area plan

## Scope

Plan only. No source files changed. No assets uploaded. No deploy/push/merge. Measurements came from local copies of the current five hero videos plus throwaway frame probes in `/tmp/jays-shop-hero-probes/`.

## Baseline facts confirmed in repo

- All five current hero videos are `1920x1080`.
- `HeroSlide.mobileUrl` already exists in `prisma/schema.prisma`.
- `HeroSlideshow.tsx` still renders hero video with `object-cover` and preserves the `f675fb2` iOS Safari guard: **no `translateZ` and no `will-change: transform` on the `<video>`**.
- Production hero-video uploads already target Cloudflare R2 when R2 env vars are configured; local `/public/hero-videos/...` is only the fallback path.
- The existing `feat/mobile-hero-scaling` branch changes the five hero wrappers to `aspect-[3/4] max-h-[calc(100svh-...)] min-h-[320px]`.

## 1) Measured text extents per hero video

### Measurement method

1. Extracted six representative frames per video with local OpenCV (`0.10`, `0.20`, `0.35`, `0.50`, `0.70`, `0.85` through the timeline).
2. Ran macOS Vision OCR on those PNG probes.
3. Reviewed annotated contact sheets to separate true overlay copy from incidental jersey/store signage text.
4. For each scope, measured the union of the relevant text boxes in source pixels.

### Source video inventory

| Scope | Local source file | Duration | Size |
|---|---|---:|---:|
| HOME | `public/hero-videos/home/1785120325358-Z4L71B1n9VMpQ3D19gsV30YsmajVzJ.mp4` | 15.6s | 6.17 MiB |
| SHOP | `public/hero-videos/shop/1785120353721-zlrtIFICrW43d3uMFI01jNFhuEgdgy.mp4` | 15.6s | 6.62 MiB |
| STYLE_LANDING | `public/hero-videos/style_landing/1785125332178-Ewn7pLopM07nP3H03hTlmftl2NsivS.mp4` | 13.0s | 6.49 MiB |
| GALLERY | `public/hero-videos/gallery/1785126440024-m3UVJ6vWVRN8jlkgweZGGWMAMXFDib.mp4` | 14.4s | 6.53 MiB |
| PLAYERS | `public/hero-videos/players/1785125356138-eRgHFuYv6k8OwPtcnyohlrLCZp6Isy.mp4` | 13.0s | 7.88 MiB |

### Measured horizontal spans

| Scope | Representative frame | Relevant measured text | Left px | Right px | Width px | Width fraction of 1920 |
|---|---|---|---:|---:|---:|---:|
| HOME | `home-0.70.png` | `AUTHENTIC BLUE JAYS GEAR` + `OFFICIAL TEAM STORE` | 443.7 | 1467.9 | 1024.2 | 53.34% |
| SHOP | `shop-0.85.png` | `GAME DAY READY` + `JERSEYS • CAPS • ACCESSORIES` | 566.5 | 1420.5 | 854.0 | 44.48% |
| STYLE_LANDING | `style_landing-0.20.png` | largest in-frame `BLUE JAYS` wordmark | 189.7 | 689.3 | 499.6 | 26.02% |
| GALLERY | `gallery-0.85.png` | storefront `TEAM STORE` sign (+ adjacent `TORONTO + BLUE JAYS`) | 945.2 | 1245.4 | 300.2 | 15.64% |
| PLAYERS | `players-0.85.png` | jersey wordmark union `BLUE` + `JAYS` | 803.2 | 1920.0 | 1116.8 | 58.16% |

## 2) Scope classification: hard overlay copy vs incidental scene text

The earlier draft was too loose here. The correct classification is:

| Scope | Classification | Must never clip? | Why |
|---|---|---|---|
| HOME | Overlay copy | Yes | This is the user-reported failure case and the copy is the message of the slide. |
| SHOP | Overlay copy | Yes | Same category as HOME: the promo line is the point of the slide. |
| STYLE_LANDING | Incidental scene text | No | The measured text is a product wordmark inside the scene, not the slide’s UX headline. |
| GALLERY | Incidental scene text | No | The measured text is storefront/signage inside the scene, not required overlay messaging. |
| PLAYERS | Incidental scene text already clipped at source | No | The measured span reaches `x=1920.0`, so it is already touching the source right edge. Symmetric safe margins are impossible because the source itself is already clipped there. |

### Consequence

- **HOME and SHOP** must be planned against measured text width plus explicit safe margin.
- **STYLE_LANDING and GALLERY** may use subject-driven art direction rather than text-driven guarantees.
- **PLAYERS** must not use the measured jersey wordmark as an acceptance criterion because the source frame already cuts into that wordmark on the right edge.

## 3) Full-width contain economics, corrected

The previous draft got this backwards. If we preserve the full `1920` source width and scale it to `1080` wide, the crisp band is always `1080x607.5`.

### Full-width contain on proposed portrait canvases

| Variant | Canvas | Crisp band | Crisp % | Blurred fill % |
|---|---|---|---:|---:|
| Short portrait | `1080x1440` (`3:4`) | `1080x607.5` | 42.2% | 57.8% |
| Tall portrait | `1080x1920` (`9:16`) | `1080x607.5` | 31.6% | 68.4% |

So the corrected conclusion is:

- `9:16` is **more** blur-dominated than `3:4`, not less.
- A full-width `9:16` mobile hero would be a blurred backdrop with a crisp strip in the middle.
- That is why **full-width contain is not the primary recommendation**.

## 4) Primary recommendation: crop only to the minimum width actually needed

The middle ground is the real answer: do **not** preserve the full `1920px` width on mobile. Preserve only the measured text span plus the safe margin required to guarantee visible padding in the final viewport.

### Safe-margin conversion

Acceptance rule: at least `16 CSS px` visible on both sides of required overlay copy.

If the final mobile viewport width is `V`, then the minimum source crop width `C` for measured text span `T` is:

`C = T / (1 - 32 / V)`

Equivalent source-side margin on each side:

`M = (C - T) / 2 = T * 16 / (V - 32)`

I used:

- `V = 375` for the short portrait breakpoint (`3:4`)
- `V = 390` for the tall portrait breakpoint (`9:16`)

### Per-scope minimum crop widths and crisp/fill percentages

| Scope | Classification | Required target? | Variant | Safe margin each side in source px for 16 CSS px visible | Min crop width px | Crisp height px after scaling crop to 1080 wide | Crisp % of canvas | Fill % of canvas | Notes |
|---|---|---|---|---:|---:|---:|---:|---:|---|
| HOME | Overlay copy | Yes | `1080x1440` (`3:4`) | 47.8 | 1119.8 | 1041.7 | 72.3% | 27.7% | This matches the user’s worked example. |
| HOME | Overlay copy | Yes | `1080x1920` (`9:16`) | 45.8 | 1115.7 | 1045.4 | 54.4% | 45.6% | Still backdrop-heavy, but much better than 68.4% fill. |
| SHOP | Overlay copy | Yes | `1080x1440` (`3:4`) | 39.8 | 933.7 | 1249.3 | 86.8% | 13.2% | Strong result. |
| SHOP | Overlay copy | Yes | `1080x1920` (`9:16`) | 38.2 | 930.3 | 1253.7 | 65.3% | 34.7% | Acceptable only if tall full-viewport is a hard product requirement. |
| STYLE_LANDING | Incidental scene text | No | `1080x1440` (`3:4`) | 23.3 | 546.2 | 2135.4 | 100.0% | 0.0% | Text-driven crop is unnecessary; subject-driven crop can fill height without blur. |
| STYLE_LANDING | Incidental scene text | No | `1080x1920` (`9:16`) | 22.3 | 544.3 | 2143.1 | 100.0% | 0.0% | Same conclusion. |
| GALLERY | Incidental scene text | No | `1080x1440` (`3:4`) | 14.0 | 328.2 | 3553.9 | 100.0% | 0.0% | Text-driven crop would be absurdly narrow; do not use signage as the crop target. |
| GALLERY | Incidental scene text | No | `1080x1920` (`9:16`) | 13.4 | 327.0 | 3566.6 | 100.0% | 0.0% | Same conclusion. |
| PLAYERS | Incidental scene text already clipped at source | No | `1080x1440` (`3:4`) | 52.1 | 1221.0 | 955.3 | 66.3% | 33.7% | Zero-right-margin proof is impossible because the measured text already touches source edge. |
| PLAYERS | Incidental scene text already clipped at source | No | `1080x1920` (`9:16`) | 49.9 | 1216.6 | 958.7 | 49.9% | 50.1% | Same blocker. |

### What that table means

- **HOME and SHOP** benefit massively from crop-to-need:
  - HOME improves from `42.2%` crisp (`3:4` full-width contain) to `72.3%` crisp (`3:4` crop-to-need).
  - SHOP improves from `42.2%` crisp to `86.8%` crisp.
- **PLAYERS** is numerically wide, but that width is incidental jersey text and already clipped at source, so it is not a valid “must preserve” target.
- **STYLE_LANDING and GALLERY** should not be text-driven at all; use subject-driven crops there and accept incidental text cropping.

## 5) The two variants: what they should actually be

I still recommend two mobile portrait variants, but their role is now clearer:

1. **Short portrait default** — `1080x1440` (`3:4`)
2. **Tall portrait optional** — `1080x1920` (`9:16`)

### Why these two

- `3:4` lines up with the already-approved wrapper branch and gives materially better crisp/fill economics.
- `9:16` only exists if the product insists on a taller, near-full-viewport mobile hero for tall phones.
- For HOME/SHOP, `9:16` is acceptable only with crop-to-need; with full-width contain it is too blur-dominated.

### Breakpoint mapping

| Variant | Canvas | Device class | Example CSS viewports | Media query | Notes |
|---|---|---|---|---|---|
| Short portrait default | `1080x1440` (`3:4`) | Short / moderate portrait phones | `375x667`, `390x700`, `414x736` | `(max-width: 767px) and (orientation: portrait) and (max-height: 760px)` | Best crisp/fill balance. |
| Tall portrait optional | `1080x1920` (`9:16`) | Tall portrait phones only if product wants more viewport occupancy | `390x844`, `393x852`, `412x915`, `430x932` | `(max-width: 767px) and (orientation: portrait) and (min-height: 761px)` | More backdrop-heavy by design. |

### Product decision hidden inside that choice

If the user wants the hero to stay visually crisp, prefer the `3:4` container/asset strategy and treat `feat/mobile-hero-scaling` as the main layout direction. If the user wants “fuller-height” tall-phone heroes, accept that the `9:16` variant will necessarily spend more of the frame on safe-area fill.

## 6) Crop-window feasibility per scope

I checked whether the text-preserving crop can actually be centered without hitting source edges.

| Scope | `3:4` crop feasible with symmetric safe margin? | `9:16` crop feasible with symmetric safe margin? | Why |
|---|---|---|---|
| HOME | Yes | Yes | Text sits comfortably inside the source. |
| SHOP | Yes | Yes | Text sits comfortably inside the source. |
| STYLE_LANDING | Yes | Yes | But this should not drive the crop. |
| GALLERY | Yes | Yes | But this should not drive the crop. |
| PLAYERS | No | No | Crop clamps against the source right edge, leaving `0px` right source margin because the wordmark is already clipped in the source frame. |

## 7) Where the assets should live and how they are served

### Repo/storage reality

Production hero-video uploads already route to Cloudflare R2:

- admin UI requests a presigned URL
- browser uploads directly to R2
- resulting public URL is stored on the `HeroSlide`

### Planned home for the new assets

Use the same production storage path family:

- `hero-videos/home/<timestamp>-...-mobile-3x4.mp4`
- `hero-videos/home/<timestamp>-...-mobile-9x16.mp4`

Repeat for `shop`, `style_landing`, `gallery`, `players`.

### Serving model

One existing nullable field is not enough to represent two portrait variants cleanly. The implementation plan should be:

- keep `url` = desktop/default asset
- keep `mobileUrl` = short portrait `3:4` asset
- add `mobileTallUrl` = tall portrait `9:16` asset

Fallback precedence:

- short portrait mobile:
  - `mobileUrl`
  - else `mobileTallUrl`
  - else `url`
- tall portrait mobile:
  - `mobileTallUrl`
  - else `mobileUrl`
  - else `url`
- desktop/tablet/non-mobile:
  - `url`

## 8) ffmpeg / ffprobe blocker status, corrected

The earlier draft was wrong to call this blocked.

### What I found

- `ffmpeg` exists at `/opt/homebrew/bin/ffmpeg`
- `ffprobe` exists at `/opt/homebrew/bin/ffprobe`
- both report version `8.1.2`
- the prior proof-of-concept directory still exists: `/tmp/jays-shop-hero-poc/`
- that directory still contains earlier outputs such as:
  - `home-hero-2x3.mp4`
  - `home-hero-9x16.mp4`
  - `shop-hero-2x3.mp4`
  - `players-hero-2x3.mp4`
  - `style_landing-hero-2x3.mp4`
  - per-scope ffmpeg logs and extracted frames

### What is actually needed

Nothing must be installed. The only environment requirement is:

- either invoke the binaries by absolute path (`/opt/homebrew/bin/ffmpeg`, `/opt/homebrew/bin/ffprobe`)
- or ensure the non-interactive shell PATH includes `/opt/homebrew/bin`

So the encode step is **not blocked by missing tooling**. It is blocked only by the current instruction not to generate final assets in this plan-only round.

## 9) Vertical fill treatment

### Decision

Use a **blurred extension backdrop with a navy grade**, not hard empty letterbox and not mirrored edges.

### Composition rules

For HOME and SHOP mobile variants:

1. Crop the source to the minimum safe width for the target variant.
2. Scale that crop to `1080` wide for the crisp layer.
3. Place the crisp layer vertically centered on the portrait canvas.
4. Fill the remaining top/bottom area with a blurred full-canvas background derived from the same frame.
5. Add a navy alpha gradient over the blurred background so the fill looks designed, not accidental.

For STYLE_LANDING, GALLERY, and PLAYERS:

- use subject-driven portrait reframing first
- only fall back to blur-fill if the chosen subject crop still leaves unused height

## 10) Concrete ffmpeg filter graph

The prior placeholder is replaced below with a runnable example.

### HOME `3:4` example (`1080x1440`) using the measured safe crop

For HOME short portrait:

- crop width: `1120`
- crop x offset: `396`
- crop y offset: `0`

```bash
/opt/homebrew/bin/ffmpeg -i input.mp4 \
  -filter_complex "
    [0:v]split=2[fgsrc][bgsrc];
    [bgsrc]
      scale=1080:1440:force_original_aspect_ratio=increase,
      crop=1080:1440,
      gblur=sigma=30:steps=2,
      eq=brightness=-0.14:saturation=1.05
    [bg];
    color=c=#041E42:s=1080x1440:d=15.6,
      format=rgba,
      geq=
        r='4':
        g='30':
        b='66':
        a='255*(0.16+0.28*abs((Y/H)-0.5)*2)'
    [navy];
    [bg][navy]overlay=0:0[bg_navy];
    [fgsrc]
      crop=1120:1080:396:0,
      scale=1080:-1:flags=lanczos
    [fg];
    [bg_navy][fg]overlay=0:(H-h)/2[outv]
  " \
  -map "[outv]" \
  -an \
  -c:v libx264 \
  -preset slow \
  -profile:v high \
  -level 4.1 \
  -pix_fmt yuv420p \
  -crf 24 \
  -maxrate 1600k \
  -bufsize 3200k \
  -movflags +faststart \
  output-home-mobile-3x4.mp4
```

### HOME `9:16` example (`1080x1920`)

Same idea, but change only the canvas-dependent pieces:

- background scale/crop to `1080x1920`
- color source size to `1080x1920`
- keep the same crop window if using the `390px`-wide acceptance target (`1116` or `1115.7`, rounded to `1116`)

```bash
/opt/homebrew/bin/ffmpeg -i input.mp4 \
  -filter_complex "
    [0:v]split=2[fgsrc][bgsrc];
    [bgsrc]
      scale=1080:1920:force_original_aspect_ratio=increase,
      crop=1080:1920,
      gblur=sigma=30:steps=2,
      eq=brightness=-0.14:saturation=1.05
    [bg];
    color=c=#041E42:s=1080x1920:d=15.6,
      format=rgba,
      geq=
        r='4':
        g='30':
        b='66':
        a='255*(0.16+0.28*abs((Y/H)-0.5)*2)'
    [navy];
    [bg][navy]overlay=0:0[bg_navy];
    [fgsrc]
      crop=1116:1080:398:0,
      scale=1080:-1:flags=lanczos
    [fg];
    [bg_navy][fg]overlay=0:(H-h)/2[outv]
  " \
  -map "[outv]" \
  -an \
  -c:v libx264 \
  -preset slow \
  -profile:v high \
  -level 4.1 \
  -pix_fmt yuv420p \
  -crf 24 \
  -maxrate 1800k \
  -bufsize 3600k \
  -movflags +faststart \
  output-home-mobile-9x16.mp4
```

### Generalization

For each scope, swap in:

- the measured crop width from the table above
- the matching crop x offset
- the target canvas height (`1440` or `1920`)

## 11) File-size / bandwidth budget

### Current desktop asset reality

Current desktop hero videos are roughly `3.3-5.1 Mbps`, which is heavy for autoplaying mobile hero media.

### Target budgets

| Variant | Duration band | Target bitrate | Target size |
|---|---|---:|---:|
| `1080x1440` (`3:4`) | `13.0-15.6s` | `1.4-1.6 Mbps` | about `2.3-3.1 MB` |
| `1080x1920` (`9:16`) | `13.0-15.6s` | `1.6-1.8 Mbps` | about `2.6-3.6 MB` |

### Interpretation

- `3:4` should be the performance default.
- `9:16` costs more bytes and yields more fill, so it should exist only if tall-phone viewport coverage is an intentional product choice.

## 12) Relationship to `feat/mobile-hero-scaling`

### Updated recommendation

Do not treat that branch as “wrong”; treat it as the **right default container direction** for the recommended `3:4` asset strategy.

### Why

- On its own, the branch is still insufficient because it only changes the container height and leaves the media as a `16:9` cover crop.
- But after switching HOME/SHOP to crop-to-need portrait renders, the branch’s `3:4` container becomes the best-aligned layout for the primary mobile asset.

### Practical planning decision

- **If the product chooses crispness over height**: fold in `feat/mobile-hero-scaling` and serve the `3:4` mobile assets as the default mobile path.
- **If the product chooses taller viewport occupancy on tall phones**: keep the branch for short portrait only and add a second taller container rule for the `9:16` path, accepting the worse fill ratio.

## 13) Files likely to change during implementation

- `prisma/schema.prisma`
- new Prisma migration
- `src/types/hero.ts`
- `src/components/shop/HeroSlideshow.tsx`
- `src/app/api/admin/hero-slides/route.ts`
- `src/app/(admin)/admin/hero-media/page.tsx`

If `HeroSlideshow.tsx` is touched, only change source-selection logic and media-query state. Do **not** add `translateZ`, `transform`, or `will-change: transform` to the `<video>`.

No changes should be made to:

- `src/components/layout/Header.tsx`
- `src/app/(public)/brands/[slug]/page.tsx`

## 14) Verification plan before anything reaches production

### Proof artifact required

The acceptance artifact must be **rendered screenshots of the actual page at fixed viewports**, plus encode logs proving which asset was selected.

### Verification matrix

Capture at least HOME and SHOP at:

- `375x667`
- `390x844`
- `393x852`
- `412x915`
- `430x932`

Then spot-check STYLE_LANDING, GALLERY, and PLAYERS at the same sizes.

### What to prove

For each viewport:

1. The selected asset is the expected short/tall mobile variant.
2. HOME and SHOP show no left/right clipping of the overlay copy.
3. HOME and SHOP retain at least `16 CSS px` visible margin on both sides.
4. No solid-navy invisible-video regression appears on iOS Safari.
5. No unexpected layout shift or first-frame flash appears.

### Concrete pre-production steps

1. Use `/opt/homebrew/bin/ffmpeg` to generate temporary `3:4` and `9:16` encodes for all five scopes into `/tmp`.
2. Wire them locally in a dev-only branch.
3. Capture screenshots at the matrix above.
4. Manually verify HOME and SHOP on a real iPhone because recent analytical review already missed a real-device failure once.
5. Save the screenshots and ffmpeg logs under a dedicated deliverable folder before any deployment decision.

## 15) What I am not fully confident about

1. The OCR-based measurements are strong enough to prove the current crop problem, but they are still representative sampled frames rather than every frame of each source.
2. The exact crop x-offsets for STYLE_LANDING, GALLERY, and PLAYERS should be art-directed by subject position, not by incidental text.
3. The right product choice between `3:4` default and `9:16` optional is not a technical truth; it is a UX decision about crispness versus viewport height.

## 16) Main risk of another failed attempt

The biggest risk is still solving only the container height and not the source framing. If HOME/SHOP remain ordinary `16:9` cover crops inside a portrait container, the text problem will fail again. The second biggest risk is choosing a tall `9:16` mobile hero without acknowledging that it necessarily increases blurred fill and decreases the percentage of crisp video.