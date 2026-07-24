import { prisma } from '@/lib/prisma'

// One-time-per-cold-start guard so we don't run the DDL on every request.
let tableEnsured = false

// Self-healing table creation for GalleryHeroImage. Vercel's build step
// only runs `prisma generate` (no automatic migrate/db push), so on a
// fresh environment (e.g. production) the table may not exist yet the
// first time this route is hit. Rather than requiring a manual one-off
// migration step, every gallery-hero API call ensures the table exists
// first via a plain, idempotent `CREATE TABLE IF NOT EXISTS` — identical
// to what `prisma db push` would generate for this model. Safe to call
// repeatedly; a no-op once the table exists.
export async function ensureGalleryHeroTable(): Promise<void> {
  if (tableEnsured) return

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GalleryHeroImage" (
      "id" TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "altText" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "GalleryHeroImage_pkey" PRIMARY KEY ("id")
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "GalleryHeroImage_isActive_sortOrder_idx"
    ON "GalleryHeroImage"("isActive", "sortOrder");
  `)

  tableEnsured = true
}
