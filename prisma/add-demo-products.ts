import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PRODUCTS = [
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
    sizesData: [
      { size: 'S', qty: 2 }, { size: 'M', qty: 3 }, { size: 'L', qty: 3 },
      { size: 'XL', qty: 1 }, { size: '2XL', qty: 1 },
    ],
  },
  {
    name: "Blue Jays Women's V-Neck Tee",
    slug: 'women-v-neck-tee',
    description: 'Soft cotton blend V-neck with embroidered Blue Jays logo. Machine washable.',
    priceCents: 3999,
    category: 'women',
    subcategory: 'tops',
    brand: 'Fanatics',
    quantity: 20,
    sizes: 'XS,S,M,L,XL',
    imageUrl: 'https://images.unsplash.com/photo-1571455786673-9d9d6c194f90?w=600&q=80',
    status: 'AVAILABLE',
    sizesData: [
      { size: 'XS', qty: 3 }, { size: 'S', qty: 4 }, { size: 'M', qty: 6 },
      { size: 'L', qty: 5 }, { size: 'XL', qty: 2 },
    ],
  },
  {
    name: 'Blue Jays Youth Replica Jersey',
    slug: 'youth-replica-jersey',
    description: 'Official youth jersey. Same great design as the adult version.',
    priceCents: 8999,
    category: 'kids',
    subcategory: 'jerseys',
    brand: 'Nike',
    quantity: 15,
    sizes: 'XS,S,M,L',
    imageUrl: 'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?w=600&q=80',
    status: 'AVAILABLE',
    sizesData: [
      { size: 'XS', qty: 3 }, { size: 'S', qty: 4 }, { size: 'M', qty: 5 },
      { size: 'L', qty: 3 },
    ],
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
    sizesData: [
      { size: '7', qty: 2 }, { size: '7 1/8', qty: 3 }, { size: '7 1/4', qty: 5 },
      { size: '7 3/8', qty: 8 }, { size: '7 1/2', qty: 6 }, { size: '7 5/8', qty: 4 },
      { size: '7 3/4', qty: 2 },
    ],
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
    sizesData: [],
  },
  {
    name: 'Blue Jays Full-Zip Hoodie',
    slug: 'full-zip-hoodie',
    description: 'Heavy fleece full-zip with embroidered chest logo and Rogers Centre graphic on back.',
    priceCents: 8499,
    category: 'men',
    subcategory: 'hoodies',
    brand: 'Fanatics',
    quantity: 18,
    sizes: 'S,M,L,XL,2XL',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
    status: 'AVAILABLE',
    sizesData: [
      { size: 'S', qty: 3 }, { size: 'M', qty: 5 }, { size: 'L', qty: 5 },
      { size: 'XL', qty: 3 }, { size: '2XL', qty: 2 },
    ],
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
    sizesData: [
      { size: 'XS', qty: 2 }, { size: 'S', qty: 3 }, { size: 'M', qty: 4 },
      { size: 'L', qty: 2 }, { size: 'XL', qty: 1 },
    ],
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
    sizesData: [],
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
    sizesData: [],
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
    sizesData: [],
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
    sizesData: [],
  },
]

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { isDefault: true } }) ?? await prisma.tenant.findFirstOrThrow()
  const location = await prisma.storeLocation.findFirst({ where: { isMainStore: true } }) ?? await prisma.storeLocation.findFirstOrThrow()
  let added = 0
  for (const p of PRODUCTS) {
    const { sizesData, ...productData } = p
    const existing = await prisma.product.findUnique({ where: { slug: productData.slug } })
    if (existing) {
      console.log(`Already exists: ${productData.name}`)
      continue
    }
    const product = await prisma.product.create({ data: { ...productData, tenantId: tenant.id } })
    for (const { size, qty } of sizesData) {
      await prisma.sizeInventory.create({
        data: { productId: product.id, size, locationId: location.id, quantity: qty, heldQuantity: 0, pickedQuantity: 0 },
      })
    }
    console.log(`Created: ${product.name}`)
    added++
  }
  console.log(`\nAdded ${added} new products.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
