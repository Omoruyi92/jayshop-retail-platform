import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

const NEW_PASSWORD = 'Bluejays2026$'

async function main() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 12)
  const admin = await prisma.admin.update({
    where: { email: 'staff@jays.shop' },
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
