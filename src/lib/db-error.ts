import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/**
 * True when the error indicates Postgres itself is unreachable
 * (e.g. container/VM stopped) rather than a query/logic bug.
 */
export function isDbConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true
  const msg = err instanceof Error ? err.message : String(err)
  return /Can't reach database server|ECONNREFUSED|connect ETIMEDOUT/i.test(msg)
}

/**
 * Standard 503 response for API routes when the DB connection is down.
 * Keeps raw Prisma stack traces out of the response body.
 */
export function dbUnavailableResponse() {
  return NextResponse.json(
    { error: 'Service temporarily unavailable. Please try again in a moment.' },
    { status: 503 }
  )
}
