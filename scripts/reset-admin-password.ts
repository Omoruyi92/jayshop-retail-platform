import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

// Usage: ADMIN_NEW_PASSWORD=xxx ADMIN_TARGET_EMAIL=xxx npx tsx scripts/reset-admin-password.ts
const NEW_PASSWORD = process.env.ADMIN_NEW_PASSWORD
const TARGET_EMAIL = process.env.ADMIN_TARGET_EMAIL

async function main() {
  if (!NEW_PASSWORD) {
    throw new Error('ADMIN_NEW_PASSWORD env var is required')
  }
  if (!TARGET_EMAIL) {
    throw new Error('ADMIN_TARGET_EMAIL env var is required')
  }
  const hash = await bcrypt.hash(NEW_PASSWORD, 12)
  const admin = await prisma.admin.update({
    where: { email: TARGET_EMAIL },
    data: { passwordHash: hash, passwordUpdatedAt: new Date() },
  })
  const match = await bcrypt.compare(NEW_PASSWORD, admin.passwordHash)
  console.log(`Updated ${admin.email} (${admin.role}). Password matches: ${match}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
