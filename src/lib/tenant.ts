import { prisma } from '@/lib/prisma'

let cachedDefaultTenantId: string | null = null

export async function getDefaultTenantId(): Promise<string> {
  if (cachedDefaultTenantId) return cachedDefaultTenantId
  const tenant =
    (await prisma.tenant.findFirst({ where: { isDefault: true }, select: { id: true } })) ??
    (await prisma.tenant.findFirstOrThrow({ select: { id: true } }))
  cachedDefaultTenantId = tenant.id
  return cachedDefaultTenantId
}
