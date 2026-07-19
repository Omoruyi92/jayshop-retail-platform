import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const admins = await prisma.admin.findMany({
    select: { id: true, email: true, role: true, passwordHash: true },
    orderBy: { createdAt: 'desc' },
  })
  for (const a of admins) {
    const isMatch = await bcrypt.compare('Musa9295$', a.passwordHash)
    console.log({ email: a.email, role: a.role, hashPrefix: a.passwordHash.slice(0, 20), matchesMusa9295: isMatch })
  }
  await prisma.$disconnect()
}

main().catch(console.error)
