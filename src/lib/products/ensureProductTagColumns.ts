import { prisma } from '@/lib/prisma'

/**
 * Self-healing guard for the `isCityConnect` / `isChampionshipGear` columns
 * on the `Product` table. Vercel's build step only runs `prisma generate`
 * (not `prisma migrate deploy`/`db push`) against production, and the
 * production `DATABASE_URL` is a Vercel "sensitive" env var that isn't
 * retrievable by CLI tooling to run a one-off migration (same constraint
 * documented in `ensureGalleryScope`). Rather than leaving a temporary,
 * DB-mutating setup endpoint live, any code path that reads/writes these
 * two Product flags calls this first — it adds the columns with
 * `ADD COLUMN IF NOT EXISTS` (a no-op once applied) so the very first
 * request after deploy self-heals the schema.
 *
 * Memoized per server instance so subsequent calls are free.
 */
let ensured = false

export async function ensureProductTagColumns(): Promise<void> {
  if (ensured) return
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isCityConnect" BOOLEAN NOT NULL DEFAULT false`
    )
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isChampionshipGear" BOOLEAN NOT NULL DEFAULT false`
    )
    ensured = true
  } catch {
    // Best-effort — if this fails (e.g. no permission, or already applied
    // by a concurrent request), subsequent queries will surface their own
    // error rather than silently swallowing a real problem.
  }
}
