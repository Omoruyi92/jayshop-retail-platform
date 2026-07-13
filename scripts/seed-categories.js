// One-off / idempotent seed for the Category table, sourced from the
// existing hardcoded MAIN_CATEGORIES / SUBS_BY_CAT lists so admins get a
// sensible starting point they can then edit from /admin/categories.
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const MAIN_CATEGORIES = ['men', 'women', 'kids', 'accessories', 'sport', 'blanks', 'authentication']

const SUBS_BY_CAT = {
  men:         ['jerseys', 'fleece', 't-shirts', 'hats', 'accessories'],
  women:       ['jerseys', 'fleece', 't-shirts', 'hats', 'accessories'],
  kids:        ['infant', 'toddler', 'child', 'child-youth', 'youth'],
  accessories: ['mugs', 'bobbleheads', 'accessories'],
  sport:       ['jerseys', 'fleece', 't-shirts', 'hats'],
  blanks:      ['t-shirts', 'jerseys', 'hoodies'],
  authentication: ['mens', 'womens', 'kids', 'accessories', 'game-used', 'other'],
}

// Custom display names for subcategory slugs that don't title-case cleanly
// (e.g. "mens" -> "Men's" rather than the default "Mens").
const SUB_NAME_OVERRIDES = {
  mens: "Men's",
  womens: "Women's",
  'game-used': 'Game Used',
}

// Custom display name for the "authentication" main category slug (shown
// to admins as "Authentic" while the storefront filter/pill still reads
// "Authentication", matching the pre-existing category nav).
const CAT_NAME_OVERRIDES = {
  authentication: 'Authentic',
}

async function main() {
  for (let i = 0; i < MAIN_CATEGORIES.length; i++) {
    const catSlug = MAIN_CATEGORIES[i]
    const catName = CAT_NAME_OVERRIDES[catSlug] ?? titleCase(catSlug)
    const existing = await prisma.category.findFirst({ where: { parentId: null, slug: catSlug } })
    const parent = existing
      ? await prisma.category.update({ where: { id: existing.id }, data: { sortOrder: i } })
      : await prisma.category.create({
          data: { name: catName, slug: catSlug, sortOrder: i },
        })

    const subs = SUBS_BY_CAT[catSlug] || []
    for (let j = 0; j < subs.length; j++) {
      const subSlug = subs[j]
      const existingSub = await prisma.category.findFirst({
        where: { parentId: parent.id, slug: subSlug },
      })
      const subName = SUB_NAME_OVERRIDES[subSlug] ?? titleCase(subSlug)
      if (existingSub) {
        await prisma.category.update({ where: { id: existingSub.id }, data: { sortOrder: j, name: subName } })
      } else {
        await prisma.category.create({
          data: { name: subName, slug: subSlug, parentId: parent.id, sortOrder: j },
        })
      }
    }
  }
  console.log('Category seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
