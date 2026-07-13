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

const MAIN_CATEGORIES = ['men', 'women', 'kids', 'accessories', 'sport', 'blanks']

const SUBS_BY_CAT = {
  men:         ['jerseys', 'fleece', 't-shirts', 'hats', 'accessories'],
  women:       ['jerseys', 'fleece', 't-shirts', 'hats', 'accessories'],
  kids:        ['infant', 'toddler', 'child', 'child-youth', 'youth'],
  accessories: ['mugs', 'bobbleheads', 'accessories'],
  sport:       ['jerseys', 'fleece', 't-shirts', 'hats'],
  blanks:      ['t-shirts', 'jerseys', 'hoodies'],
}

async function main() {
  for (let i = 0; i < MAIN_CATEGORIES.length; i++) {
    const catSlug = MAIN_CATEGORIES[i]
    const existing = await prisma.category.findFirst({ where: { parentId: null, slug: catSlug } })
    const parent = existing
      ? await prisma.category.update({ where: { id: existing.id }, data: { sortOrder: i } })
      : await prisma.category.create({
          data: { name: titleCase(catSlug), slug: catSlug, sortOrder: i },
        })

    const subs = SUBS_BY_CAT[catSlug] || []
    for (let j = 0; j < subs.length; j++) {
      const subSlug = subs[j]
      const existingSub = await prisma.category.findFirst({
        where: { parentId: parent.id, slug: subSlug },
      })
      if (existingSub) {
        await prisma.category.update({ where: { id: existingSub.id }, data: { sortOrder: j } })
      } else {
        await prisma.category.create({
          data: { name: titleCase(subSlug), slug: subSlug, parentId: parent.id, sortOrder: j },
        })
      }
    }
  }
  console.log('Category seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
