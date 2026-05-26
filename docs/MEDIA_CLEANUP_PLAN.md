# Jays Shop — Media Asset Cleanup & Storage-UI Synchronization Plan

## Objective

Resolve the divergence between `public/uploads/` (82 files on disk) and the product database by:

1. Safely removing orphaned upload files not referenced by any active product or historical record
2. Preventing future orphans by wiring cascade-delete into the `DELETE` and `PATCH` (image-replace) handlers
3. Adding an admin audit endpoint for ongoing visibility

---

## Audit Results (as of implementation)

| Metric | Count |
|---|---|
| Files on disk (`public/uploads/`) | 82 |
| Actively referenced files | 22 |
| **Orphan files (safe to remove)** | **60** |
| Broken DB references | 0 |

---

## Architecture Decisions

| Decision | Choice |
|---|---|
| Orphan detection strategy | Filesystem-first; cross-reference `Product.imageUrl` AND `HoldHistory.productImageUrlSnapshot` |
| Cleanup safety | Two-phase: dry-run (default) then `--execute` moves to `.orphan-backup/<timestamp>/` |
| Cascading delete | Inline in `DELETE` handler with reference-count guard (post-delete) |
| Archive behavior | No file deletion on archive — `ARCHIVED` is a soft flag, row persists |
| PATCH image replace | Cleanup old file after successful update only if zero remaining references |
| Verification | `GET /api/admin/media/audit` returns structured JSON |

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/media/cleanup.ts` | NEW — shared utilities: `isLocalUpload`, `extractFilename`, `resolveUploadPath`, `getImageReferences`, `safeUnlinkUpload`, `uploadFileExists` |
| `scripts/media-audit.ts` | NEW — CLI script: dry-run + `--execute` cleanup with timestamped backup dir |
| `src/app/api/admin/products/[id]/route.ts` | MODIFIED — DELETE handler now removes local file post-delete; PATCH handler removes old file when image is replaced |
| `src/app/api/admin/products/route.ts` | MODIFIED — `mkdir({ recursive: true })` before `writeFile` in upload handler |
| `src/app/api/admin/media/audit/route.ts` | NEW — `GET /api/admin/media/audit` admin-protected endpoint |
| `package.json` | MODIFIED — added `media:audit` and `media:cleanup` scripts |
| `.gitignore` | MODIFIED — excludes `public/uploads/.orphan-backup/` |

---

## How to Use

### Run the audit (dry-run, no changes)
```bash
npm run media:audit
```

### Move orphans to backup directory
```bash
npm run media:cleanup
# Files are moved to public/uploads/.orphan-backup/<ISO-timestamp>/
```

### Permanently remove backups (after verifying shop works)
```bash
rm -rf public/uploads/.orphan-backup/
```

### Rollback
```bash
cp -r public/uploads/.orphan-backup/<timestamp>/* public/uploads/
```

### Admin API audit
```bash
GET /api/admin/media/audit
# Returns: { summary: { totalUploadFiles, referencedFiles, orphanCount, brokenDbRefs, safeToDeleteCount }, orphans[], brokenRefs[] }
```

---

## Cascade-Delete Behaviour (going forward)

- **Product DELETE** → after DB delete succeeds, checks reference count in both `Product` and `HoldHistory` tables; unlinks file only if count is 0
- **Product PATCH with new image** → fetches old `imageUrl` before update; after successful update, unlinks old file if it changed and has no remaining references
- **Product ARCHIVE** → no file deletion (DB row persists, image still needed)
- **External URLs** → always skipped (`isLocalUpload()` guard)

---

## Prevention: `HoldHistory` snapshots are protected

`getImageReferences()` explicitly queries `HoldHistory.productImageUrlSnapshot`, so images referenced by resolved-hold records are never deleted even after the source product is removed.
