import { prisma } from "@/lib/prisma"

async function main() {
    const holds = await prisma.hold.findMany({
        where: { status: "ACTIVE" },
        include: { product: true, customer: true },
        take: 10
    })
    const sizeInvs = await prisma.sizeInventory.findMany({ take: 20 })
    console.log(JSON.stringify({ holds, sizeInvs }))
    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
