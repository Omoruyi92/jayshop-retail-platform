import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  const a = await prisma.admin.findUnique({ where: { email: 'viewer@jays.shop' } })
  console.log({ email: a?.email, role: a?.role, hasHash: !!a?.passwordHash })
  if (a) {
    console.log('matches Musa9295$:', await bcrypt.compare('Musa9295$', a.passwordHash))
  }
  await prisma.$disconnect()
}

main().catch(console.error)
