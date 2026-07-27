import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

// Usage: CHECK_PASSWORD_CANDIDATE=xxx npx tsx scripts/check-passwords.ts
const CANDIDATE_PASSWORD = process.env.CHECK_PASSWORD_CANDIDATE

async function main() {
  if (!CANDIDATE_PASSWORD) {
    throw new Error('CHECK_PASSWORD_CANDIDATE env var is required')
  }
  const admins = await prisma.admin.findMany({
    select: { id: true, email: true, role: true, passwordHash: true },
    orderBy: { createdAt: 'desc' },
  })
  for (const a of admins) {
    const isMatch = await bcrypt.compare(CANDIDATE_PASSWORD, a.passwordHash)
    console.log({ email: a.email, role: a.role, hashPrefix: a.passwordHash.slice(0, 20), matchesCandidate: isMatch })
  }
  await prisma.$disconnect()
}

main().catch(console.error)
