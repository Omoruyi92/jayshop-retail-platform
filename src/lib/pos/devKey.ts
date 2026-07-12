import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateRawPosKey, POS_BCRYPT_COST } from '@/lib/pos/auth'

const DEV_KEY_NAME = 'Dev Simulator Key'

// Raw keys are never persisted (only bcrypt hashes are), so we cache the
// current dev simulator key's raw value in process memory. If the process
// restarts, the cached value is lost even though the DB row survives —
// in that case we deactivate the orphaned row and mint a fresh one so the
// simulator always has a usable key without any manual admin action.
let cached: { id: string; rawKey: string } | null = null

/**
 * Returns a raw POS API key the /admin/pos-simulator dev tool can use to
 * call POST /api/pos/transaction, creating one on first use.
 */
export async function getOrCreateDevApiKey(): Promise<string> {
  if (cached) return cached.rawKey

  const existing = await prisma.posApiKey.findFirst({ where: { name: DEV_KEY_NAME, active: true } })
  if (existing) {
    // We don't have the raw value anymore (only the hash) — this row is
    // orphaned from a previous process. Revoke it and mint a replacement.
    await prisma.posApiKey.update({ where: { id: existing.id }, data: { active: false } })
  }

  const rawKey = generateRawPosKey()
  const keyHash = await bcrypt.hash(rawKey, POS_BCRYPT_COST)
  const created = await prisma.posApiKey.create({
    data: { name: DEV_KEY_NAME, keyHash, createdBy: 'system:pos-simulator' },
  })

  cached = { id: created.id, rawKey }
  return rawKey
}
