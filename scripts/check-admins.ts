import { prisma } from '../src/lib/prisma'

async function main() {
  const admins = await prisma.admin.findMany({
    select: { id: true, email: true, role: true },
    orderBy: { createdAt: 'desc' },
  })
  console.log(JSON.stringify(admins, null, 2))
  await prisma.$disconnect()
}

main()