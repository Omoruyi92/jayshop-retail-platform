import { prisma } from '../src/lib/prisma'

async function main() {
  const a = await prisma.admin.findUnique({ where: { email: 'staff@jays.shop' } })
  console.log({
    id: a?.id,
    email: a?.email,
    role: a?.role,
    hashPrefix: a?.passwordHash?.slice(0, 20),
  })
  await prisma.$disconnect()
}

main().catch(console.error)
