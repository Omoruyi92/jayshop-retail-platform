import { prisma } from '@/lib/prisma'

/**
 * Self-healing guard for the `GALLERY` value on the `SlideScope` Postgres
 * enum. Vercel's build step only runs `prisma generate` (not `prisma
 * migrate deploy`/`db push`) against production, and the production
 * `DATABASE_URL` is a Vercel "sensitive" env var that isn't retrievable by
 * CLI tooling to run a one-off migration. Rather than leaving a
 * temporary, DB-mutating setup endpoint live (the approach explicitly
 * rejected for the standalone GalleryHeroImage table), any code path that
 * reads/writes `HeroSlide` rows with `scope: 'GALLERY'` calls this first —
 * it adds the enum value with `ADD VALUE IF NOT EXISTS` (a no-op once
 * applied) so the very first request after deploy self-heals the schema.
 * Memoized per server instance so subsequent calls are free.
 */
let ensured = false

export async function ensureGalleryScope(): Promise<void> {
  if (ensured) return
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "SlideScope" ADD VALUE IF NOT EXISTS 'GALLERY'`)
    ensured = true
  } catch {
    // Best-effort — if this fails (e.g. no permission, or already applied
    // by a concurrent request), subsequent queries will surface their own
    // error rather than silently swallowing a real problem.
  }
}
