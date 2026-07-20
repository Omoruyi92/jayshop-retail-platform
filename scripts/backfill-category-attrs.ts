import { prisma } from '../src/lib/prisma'
import { PRODUCT_TYPES_BY_CAT, BRANDS_BY_CAT, brandToSlug } from '../src/lib/constants'

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Seeds CategoryProductType and CategoryBrand rows from the legacy
// PRODUCT_TYPES_BY_CAT / BRANDS_BY_CAT constants so admin-managed dynamic
// Types/Brands start with the same options that were previously hardcoded.
// Safe to re-run: skips categories/keys that already have rows or don't
// exist as a top-level Category (e.g. 'featured', 'sales-clearance').
async function main() {
  const topCategories = await prisma.category.findMany({ where: { parentId: null } })
  const bySlug = new Map(topCategories.map((c) => [c.slug, c]))

  for (const [slug, types] of Object.entries(PRODUCT_TYPES_BY_CAT)) {
    const category = bySlug.get(slug)
    if (!category) {
      console.log(`Skipping product types for "${slug}" — no matching top-level Category row`)
      continue
    }
    const existing = await prisma.categoryProductType.count({ where: { categoryId: category.id } })
    if (existing > 0) {
      console.log(`Skipping product types for "${slug}" — already has ${existing} rows`)
      continue
    }
    for (let i = 0; i < types.length; i++) {
      const name = types[i]
      await prisma.categoryProductType.create({
        data: { categoryId: category.id, name, slug: slugify(name), sortOrder: i },
      })
    }
    console.log(`Seeded ${types.length} product types for "${slug}"`)
  }

  for (const [slug, brandNames] of Object.entries(BRANDS_BY_CAT)) {
    const category = bySlug.get(slug)
    if (!category) {
      console.log(`Skipping brands for "${slug}" — no matching top-level Category row`)
      continue
    }
    const existing = await prisma.categoryBrand.count({ where: { categoryId: category.id } })
    if (existing > 0) {
      console.log(`Skipping brands for "${slug}" — already has ${existing} rows`)
      continue
    }
    for (let i = 0; i < brandNames.length; i++) {
      const name = brandNames[i]
      let brand = await prisma.brand.findUnique({ where: { name } })
      if (!brand) {
        brand = await prisma.brand.create({ data: { name, slug: brandToSlug(name) } })
        console.log(`Created missing Brand "${name}"`)
      }
      await prisma.categoryBrand.create({
        data: { categoryId: category.id, brandId: brand.id, sortOrder: i },
      })
    }
    console.log(`Seeded ${brandNames.length} brands for "${slug}"`)
  }

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
