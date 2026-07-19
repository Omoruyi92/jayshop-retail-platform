import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function getOrCreateDefaultTenant() {
  const existing = await prisma.tenant.findFirst({ where: { isDefault: true } })
  if (existing) return existing
  const first = await prisma.tenant.findFirst()
  if (first) return first
  return prisma.tenant.create({
    data: { name: "Jay's Shop", slug: 'jays-shop', isDefault: true },
  })
}

async function getOrCreateMainLocation(tenantId: string) {
  const existing = await prisma.storeLocation.findFirst({ where: { isMainStore: true } })
  if (existing) return existing
  const first = await prisma.storeLocation.findFirst()
  if (first) return first
  return prisma.storeLocation.create({
    data: { tenantId, code: 'MAIN', name: 'Main Store', isMainStore: true },
  })
}

async function seedAdmin(tenantId: string) {
  const existing = await prisma.admin.findUnique({ where: { email: 'admin@jays.shop' } })
  if (existing) {
    console.log('Admin already exists, skipping.')
    return
  }

  const passwordHash = await bcrypt.hash('Musa9295$', 12)
  await prisma.admin.create({
    data: {
      email: 'admin@jays.shop',
      passwordHash,
      role: 'OWNER',
      tenantId,
    },
  })
  console.log('Admin created: admin@jays.shop')

  // Slack settings (no webhook URL — demo stub)
  const slackExists = await prisma.slackSettings.findFirst()
  if (!slackExists) {
    await prisma.slackSettings.create({
      data: {
        webhookUrl: '',
        channelName: '#jays-shop-holds',
        interactiveEnabled: false,
      },
    })
    console.log('Slack settings stub created.')
  }
}

interface SeedProduct {
  name: string
  slug: string
  description: string
  priceCents: number
  category: string
  subcategory: string
  brand: string
  quantity: number
  sizes: string
  imageUrl: string
  status: string
}

const DEMO_PRODUCTS: SeedProduct[] = [
  {
    name: 'Vladimir Guerrero Jr. #27 Home Jersey',
    slug: 'vlad-jr-home-jersey',
    description: 'Official Nike replica jersey, navy blue with white lettering. Authentic team colours with tackle-twill name and number.',
    priceCents: 17999,
    category: 'men',
    subcategory: 'jerseys',
    brand: 'Nike',
    quantity: 12,
    sizes: 'S,M,L,XL,2XL,3XL',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: 'Bo Bichette #11 Away Jersey',
    slug: 'bo-bichette-away-jersey',
    description: 'Authentic MLB away jersey in grey with jays-red accents. Moisture-wicking fabric ideal for warm days.',
    priceCents: 16999,
    category: 'men',
    subcategory: 'jerseys',
    brand: 'Nike',
    quantity: 10,
    sizes: 'S,M,L,XL,2XL',
    imageUrl: 'https://images.unsplash.com/photo-1529520426793-9e2a5e3f2b03?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: "Blue Jays Women's V-Neck Tee",
    slug: 'women-v-neck-tee',
    description: 'Soft cotton blend V-neck with embroidered Blue Jays logo on the chest. Machine washable.',
    priceCents: 3999,
    category: 'women',
    subcategory: 'tops',
    brand: 'Fanatics',
    quantity: 20,
    sizes: 'XS,S,M,L,XL',
    imageUrl: 'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: "Blue Jays Youth Replica Jersey",
    slug: 'youth-replica-jersey',
    description: 'Official youth jersey designed for smaller frames. Same great design as the adult version.',
    priceCents: 8999,
    category: 'kids',
    subcategory: 'jerseys',
    brand: 'Nike',
    quantity: 15,
    sizes: 'XS,S,M,L',
    imageUrl: 'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: 'Blue Jays New Era 59Fifty Fitted Cap',
    slug: 'new-era-fitted-cap',
    description: "Structured crown fitted cap with authentic team logo. New Era's flagship game-day model.",
    priceCents: 4999,
    category: 'hats',
    subcategory: 'fitted',
    brand: 'New Era',
    quantity: 30,
    sizes: '7,7 1/8,7 1/4,7 3/8,7 1/2,7 5/8,7 3/4',
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: 'Blue Jays Snapback Cap',
    slug: 'snapback-cap',
    description: 'Adjustable snapback with flat brim and embroidered bird head logo. One size fits most.',
    priceCents: 3499,
    category: 'hats',
    subcategory: 'snapbacks',
    brand: 'New Era',
    quantity: 25,
    sizes: '',
    imageUrl: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: 'Blue Jays Full-Zip Hoodie',
    slug: 'full-zip-hoodie',
    description: 'Heavy fleece full-zip hoodie with embroidered chest logo and Rogers Centre graphic on back.',
    priceCents: 8499,
    category: 'men',
    subcategory: 'hoodies',
    brand: 'Fanatics',
    quantity: 18,
    sizes: 'S,M,L,XL,2XL',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: "Blue Jays Women's Quarter-Zip Fleece",
    slug: 'women-quarter-zip-fleece',
    description: 'Soft-shell quarter-zip with metallic Blue Jays wordmark. Great for cool stadium evenings.',
    priceCents: 6999,
    category: 'women',
    subcategory: 'hoodies',
    brand: 'Fanatics',
    quantity: 12,
    sizes: 'XS,S,M,L,XL',
    imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: 'Blue Jays Ceramic Coffee Mug',
    slug: 'coffee-mug',
    description: '15 oz ceramic mug with full-wrap team logo. Microwave and dishwasher safe.',
    priceCents: 1999,
    category: 'accessories',
    subcategory: 'mugs',
    brand: 'MLB',
    quantity: 40,
    sizes: '',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: 'Blue Jays Insulated Water Bottle',
    slug: 'insulated-water-bottle',
    description: '32 oz stainless steel insulated bottle. Keeps cold 24h, hot 12h. Leak-proof lid.',
    priceCents: 3499,
    category: 'accessories',
    subcategory: 'drinkware',
    brand: 'MLB',
    quantity: 25,
    sizes: '',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: 'Blue Jays Pennant Flag',
    slug: 'pennant-flag',
    description: 'Classic felt pennant, 30 × 12 in, with wood dowel. Perfect for bedroom or office wall.',
    priceCents: 1299,
    category: 'memorabilia',
    subcategory: 'flags',
    brand: 'WinCraft',
    quantity: 50,
    sizes: '',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80',
    status: 'AVAILABLE',
  },
  {
    name: 'Blue Jays Autograph Mini Bat',
    slug: 'mini-bat',
    description: 'Official MLB souvenir mini bat, 18 in. Hand-finished with team colours. Great keepsake.',
    priceCents: 2499,
    category: 'memorabilia',
    subcategory: 'collectibles',
    brand: 'MLB',
    quantity: 8,
    sizes: '',
    imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80',
    status: 'AVAILABLE',
  },
]

// Sizes that get per-size inventory rows (comma-separated)
const SIZE_QTY_MAP: Record<string, number> = {
  XS: 2,
  S: 3,
  M: 5,
  L: 5,
  XL: 3,
  '2XL': 2,
  '3XL': 1,
  '7': 2,
  '7 1/8': 3,
  '7 1/4': 4,
  '7 3/8': 5,
  '7 1/2': 4,
  '7 5/8': 3,
  '7 3/4': 2,
}

async function seedDemoProducts(tenantId: string, locationId: string) {
  const count = await prisma.product.count()
  if (count > 0) {
    console.log(`Products already exist (${count} found), skipping product seeding.`)
    return
  }

  for (const p of DEMO_PRODUCTS) {
    const product = await prisma.product.create({ data: { ...p, tenantId } })

    // Seed SizeInventory rows for products with sizes
    if (p.sizes) {
      const sizeList = p.sizes.split(',').map((s) => s.trim()).filter(Boolean)
      for (const size of sizeList) {
        const qty = SIZE_QTY_MAP[size] ?? 3
        await prisma.sizeInventory.create({
          data: {
            productId: product.id,
            size,
            locationId,
            quantity: qty,
            heldQuantity: 0,
            pickedQuantity: 0,
          },
        })
      }
    }
    console.log(`Created: ${product.name}`)
  }

  console.log(`\nCreated ${DEMO_PRODUCTS.length} demo products with size inventories.`)
}

async function main() {
  console.log('Seeding Jays Shop...')

  const tenant = await getOrCreateDefaultTenant()
  const location = await getOrCreateMainLocation(tenant.id)

  await seedAdmin(tenant.id)
  await seedDemoProducts(tenant.id, location.id)

  console.log('\nSeed complete!')
  console.log('---------------------------------')
  console.log('Admin login:  admin@jays.shop')
  console.log('Password:     Bluejays2026')
  console.log('---------------------------------')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
