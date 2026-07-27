import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

// Usage: CHECK_PASSWORD_CANDIDATE=xxx npx tsx scripts/check-viewer.ts
const CANDIDATE_PASSWORD = process.env.CHECK_PASSWORD_CANDIDATE

async function main() {
  if (!CANDIDATE_PASSWORD) {
    throw new Error('CHECK_PASSWORD_CANDIDATE env var is required')
  }
  const a = await prisma.admin.findUnique({ where: { email: 'viewer@jays.shop' } })
  console.log({ email: a?.email, role: a?.role, hasHash: !!a?.passwordHash })
  if (a) {
    console.log('matches candidate:', await bcrypt.compare(CANDIDATE_PASSWORD, a.passwordHash))
  }
  await prisma.$disconnect()
}

main().catch(console.error)
