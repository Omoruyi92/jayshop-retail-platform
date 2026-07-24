import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/authorize.server'

// TEMPORARY, one-time setup endpoint used to create the GalleryHeroImage
// table on production. Vercel's build step only runs `prisma generate`
// (no automatic migrate/push), and the production DATABASE_URL is a
// write-only "sensitive" env var not retrievable via any CLI tooling, so
// this endpoint creates the table using a plain, idempotent, additive
// `CREATE TABLE IF NOT EXISTS` statement identical to what
// `prisma db push` would generate. Gated by the existing admin auth
// (same requireRole check as the gallery-hero admin API) so only an
// authenticated MANAGER/OWNER admin can invoke it. Delete this file once
// the table has been confirmed created in production.
export async function POST(req: Request) {
  const { error } = await requireRole(req, 'gallery-hero:write')
  if (error) return error

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

  const count = await prisma.galleryHeroImage.count()

  return NextResponse.json({ ok: true, tableReady: true, existingRows: count })
}
