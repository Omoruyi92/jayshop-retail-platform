import { PrismaClient } from '@prisma/client'
import { isDbConnectionError } from './db-error'

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
// connection budget. `connect_timeout` is also raised: our DB provider
// (Neon) suspends its compute when idle and can take several seconds to
// resume on the first connection after a quiet spell — Prisma's 5s default
// isn't always enough, and was surfacing as "Can't reach database server"
// even though the DB was simply still waking up.
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
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '8')
    }
    return parsed.toString()
  } catch {
    // Malformed/non-standard URL (shouldn't happen) — fall back to the
    // raw value rather than breaking the datasource entirely.
    return url
  }
}

// A single hard refresh of a page like the PDP fires several serverless
// functions concurrently (the page's own RSC render plus half a dozen
// client-side API routes for cart/likes/notifications/etc.), each cold
// starting its own Prisma instance and connection pool. Bursts like that,
// plus our DB provider's idle-suspend/resume behavior, can transiently
// surface as "Can't reach database server" — even though the DB is healthy
// a moment later once the burst settles or the compute finishes waking up.
// Only genuine connection-level failures are retried (see
// `isDbConnectionError`); a real query/logic error fails immediately since
// retrying it would never succeed and only adds latency.
export async function withDbRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 300): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (!isDbConnectionError(error) || attempt === attempts - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
    }
  }
  throw lastError
}

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: buildDatasourceUrl() } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma

// Rather than relying on every call site across the app to remember to wrap
// its query in `withDbRetry` (several pages/routes didn't — /, /gallery,
// /shop-by-style, /brands/[slug] were all still throwing raw on a
// connection blip), retry is applied here once via a client extension so
// *every* query through this shared `prisma` instance benefits
// automatically. `withDbRetry` above is still exported for call sites that
// want a longer/explicit retry budget around a specific critical query.
// Cast back to `PrismaClient`: the extended client is fully
// runtime-compatible (same models/methods, just retried under the hood),
// but `$extends`'s generated type isn't structurally assignable to
// `PrismaClient`/`Prisma.TransactionClient` in the many existing call sites
// across the app (mutations.ts's `$transaction` callbacks, etc.). Casting
// here avoids touching every one of those call sites just to satisfy a
// type-level technicality.
export const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ query, args }) {
      return withDbRetry(() => query(args))
    },
  },
}) as unknown as PrismaClient
