import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const POS_BCRYPT_COST = 10

export type PosAuthResult =
  | { ok: true; apiKey: { id: string; name: string; locationId: string | null } }
  | { ok: false; response: NextResponse }

type CacheEntry = { apiKeyId: string; name: string; locationId: string | null; expiresAt: number }

// Short-lived in-memory cache so a POS register hammering the same key at
// ~50 rps doesn't pay a bcrypt.compare() (~60-100ms) on every single
// request. Keyed by a SHA-256 digest of the raw key (never the raw key
// itself), TTL only a few seconds — the bcrypt hash in the DB remains the
// source of truth and revocation (active=false) is picked up on next miss.
const AUTH_CACHE_TTL_MS = 5000
const authCache = new Map<string, CacheEntry>()

// Throttle lastUsedAt writes so a hot key doesn't issue a DB write on every
// single request; still updated at least once per this window.
const LAST_USED_THROTTLE_MS = 10000
const lastUsedWrites = new Map<string, number>()

function digest(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

/**
 * Authenticates a POS webhook request via `Authorization: Bearer <raw-key>`.
 * Compares against active keys' bcrypt hashes (key count is expected to
 * stay small — one per register/location), updates lastUsedAt on success.
 * Never logs the raw key.
 */
export async function authenticatePosRequest(req: Request): Promise<PosAuthResult> {
  const header = req.headers.get('authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return { ok: false, response: NextResponse.json({ error: 'Missing Authorization: Bearer <api-key> header' }, { status: 401 }) }
  }
  const rawKey = match[1].trim()
  if (!rawKey) {
    return { ok: false, response: NextResponse.json({ error: 'Empty API key' }, { status: 401 }) }
  }

  const cacheKey = digest(rawKey)
  const cached = authCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    touchLastUsed(cached.apiKeyId)
    return { ok: true, apiKey: { id: cached.apiKeyId, name: cached.name, locationId: cached.locationId } }
  }

  const activeKeys = await prisma.posApiKey.findMany({
    where: { active: true },
    select: { id: true, name: true, keyHash: true, locationId: true },
  })

  for (const k of activeKeys) {
    const matches = await bcrypt.compare(rawKey, k.keyHash)
    if (matches) {
      authCache.set(cacheKey, {
        apiKeyId: k.id,
        name: k.name,
        locationId: k.locationId,
        expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
      })
      await prisma.posApiKey.update({
        where: { id: k.id },
        data: { lastUsedAt: new Date() },
      })
      lastUsedWrites.set(k.id, Date.now())
      return { ok: true, apiKey: { id: k.id, name: k.name, locationId: k.locationId } }
    }
  }

  return { ok: false, response: NextResponse.json({ error: 'Invalid API key' }, { status: 401 }) }
}

function touchLastUsed(apiKeyId: string) {
  const last = lastUsedWrites.get(apiKeyId) ?? 0
  if (Date.now() - last < LAST_USED_THROTTLE_MS) return
  lastUsedWrites.set(apiKeyId, Date.now())
  prisma.posApiKey.update({ where: { id: apiKeyId }, data: { lastUsedAt: new Date() } }).catch(() => {})
}

/** Generates a raw POS API key, e.g. `pos_live_<random>`. Shown once to the admin. */
export function generateRawPosKey(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const b64 = Buffer.from(bytes).toString('base64url')
  return `pos_live_${b64}`
}

export function maskPosKey(name: string): string {
  return `${name} (••••••••)`
}

