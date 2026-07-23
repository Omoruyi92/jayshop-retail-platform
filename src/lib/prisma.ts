import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Vercel's serverless functions each get their own process/connection pool,
// and Prisma's default pool size (num_cpus * 2 + 1) can spike well past a
// Postgres provider's total connection limit when several routes/pages
// (e.g. the PDP, which fires ~6 concurrent queries per request) all cold
// start around the same time — surfacing as an intermittent "Application
// error: a server-side exception has occurred" on hard refresh. Capping the
// per-instance pool via `connection_limit` (and giving queued queries a
// bounded `pool_timeout` instead of Prisma's default indefinite wait) keeps
// any single serverless invocation from exhausting the shared database
// connection budget.
function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '5')
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '10')
    }
    return parsed.toString()
  } catch {
    // Malformed/non-standard URL (shouldn't happen) — fall back to the
    // raw value rather than breaking the datasource entirely.
    return url
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: buildDatasourceUrl() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
