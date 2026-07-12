import { prisma } from '../src/lib/prisma'

async function main() {
  const settings = await prisma.holdSettings.findFirst()
  if (!settings) {
    console.log('No HoldSettings row exists; default will be created on first read.')
    return
  }

  const updated = await prisma.holdSettings.update({
    where: { id: settings.id },
    data: { standardHoldHours: 3 },
  })

  console.log(`Updated HoldSettings id=${updated.id}: standardHoldHours = ${updated.standardHoldHours}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
