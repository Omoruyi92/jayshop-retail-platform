/**
 * One-time migration: download image assets hosted on Vercel Blob and save
 * them to public/uploads/<table>/ as static assets.
 *
 * Run with:
 *   DATABASE_URL=... npx tsx scripts/migrate-blob-images-to-static.ts
 *
 * Handles:
 *   - Product.imageUrl / imageUrl2 / imageUrl3
 *   - Brand.imageUrl
 *   - StoreGalleryImage.imageUrl
 *   - StyleCategory.coverImageUrl
 *   - Player.heroImageUrl + imageUrls (CSV)
 *   - CustomerPhoto.imageUrl
 *   - CustomerStyleImage.imageUrl
 *   - Testimonial/notification URLs are skipped because they live in JSON/text
 *     fields without a stable source-of-truth table.
 *
 * Source blob objects are NOT deleted by default. Set DELETE_SOURCE_BLOB=true
 * to remove them after a successful local write.
 */
import { prisma } from '../src/lib/prisma'
import { isBlobUpload } from '../src/lib/media/upload'
import { saveUploadedFile, deleteUploadedFile } from '../src/lib/media/server/upload.server'

const DELETE_SOURCE_BLOB = process.env.DELETE_SOURCE_BLOB === 'true'

interface BlobRef {
  table: string
  id: string
  field: string
  url: string
  index?: number // for CSV arrays
}

async function collectBlobRefs(): Promise<BlobRef[]> {
  const refs: BlobRef[] = []

  const products = await prisma.product.findMany({
    select: { id: true, imageUrl: true, imageUrl2: true, imageUrl3: true },
  })
  for (const p of products) {
    for (const [field, url] of [
      ['imageUrl', p.imageUrl],
      ['imageUrl2', p.imageUrl2],
      ['imageUrl3', p.imageUrl3],
    ] as const) {
      if (isBlobUpload(url)) refs.push({ table: 'Product', id: p.id, field, url })
    }
  }

  const brands = await prisma.brand.findMany({ select: { id: true, imageUrl: true } })
  for (const b of brands) {
    if (isBlobUpload(b.imageUrl)) refs.push({ table: 'Brand', id: b.id, field: 'imageUrl', url: b.imageUrl })
  }

  const gallery = await prisma.storeGalleryImage.findMany({ select: { id: true, imageUrl: true } })
  for (const g of gallery) {
    if (isBlobUpload(g.imageUrl)) refs.push({ table: 'StoreGalleryImage', id: g.id, field: 'imageUrl', url: g.imageUrl })
  }

  const styles = await prisma.styleCategory.findMany({ select: { id: true, coverImageUrl: true, heroImageUrl: true } })
  for (const s of styles) {
    if (isBlobUpload(s.coverImageUrl)) refs.push({ table: 'StyleCategory', id: s.id, field: 'coverImageUrl', url: s.coverImageUrl })
    if (s.heroImageUrl && isBlobUpload(s.heroImageUrl)) refs.push({ table: 'StyleCategory', id: s.id, field: 'heroImageUrl', url: s.heroImageUrl })
  }

  const players = await prisma.player.findMany({ select: { id: true, heroImageUrl: true, imageUrls: true } })
  for (const p of players) {
    if (isBlobUpload(p.heroImageUrl)) refs.push({ table: 'Player', id: p.id, field: 'heroImageUrl', url: p.heroImageUrl })
    p.imageUrls.split(',').forEach((url, idx) => {
      if (isBlobUpload(url)) refs.push({ table: 'Player', id: p.id, field: 'imageUrls', url, index: idx })
    })
  }

  const photos = await prisma.customerPhoto.findMany({ select: { id: true, imageUrl: true } })
  for (const c of photos) {
    if (isBlobUpload(c.imageUrl)) refs.push({ table: 'CustomerPhoto', id: c.id, field: 'imageUrl', url: c.imageUrl })
  }

  const styleImages = await prisma.customerStyleImage.findMany({ select: { id: true, imageUrl: true } })
  for (const i of styleImages) {
    if (isBlobUpload(i.imageUrl)) refs.push({ table: 'CustomerStyleImage', id: i.id, field: 'imageUrl', url: i.imageUrl })
  }

  return refs
}

function fileNameFromUrl(url: string): string {
  const base = url.split('/').pop() || `${Date.now()}`
  return base.split('?')[0].replace(/[^a-zA-Z0-9._-]/g, '_') || `${Date.now()}.bin`
}

async function updateRecord(ref: BlobRef, newUrl: string) {
  switch (ref.table) {
    case 'Product':
      await prisma.product.update({ where: { id: ref.id }, data: { [ref.field]: newUrl } })
      break
    case 'Brand':
      await prisma.brand.update({ where: { id: ref.id }, data: { imageUrl: newUrl } })
      break
    case 'StoreGalleryImage':
      await prisma.storeGalleryImage.update({ where: { id: ref.id }, data: { imageUrl: newUrl } })
      break
    case 'StyleCategory':
      await prisma.styleCategory.update({ where: { id: ref.id }, data: { [ref.field]: newUrl } })
      break
    case 'Player': {
      if (ref.field === 'heroImageUrl') {
        await prisma.player.update({ where: { id: ref.id }, data: { heroImageUrl: newUrl } })
      } else if (ref.field === 'imageUrls' && typeof ref.index === 'number') {
        const current = await prisma.player.findUnique({ where: { id: ref.id }, select: { imageUrls: true } })
        if (current) {
          const arr = current.imageUrls.split(',')
          arr[ref.index] = newUrl
          await prisma.player.update({ where: { id: ref.id }, data: { imageUrls: arr.join(',') } })
        }
      }
      break
    }
    case 'CustomerPhoto':
      await prisma.customerPhoto.update({ where: { id: ref.id }, data: { imageUrl: newUrl } })
      break
    case 'CustomerStyleImage':
      await prisma.customerStyleImage.update({ where: { id: ref.id }, data: { imageUrl: newUrl } })
      break
  }
}

async function main() {
  const refs = await collectBlobRefs()
  console.log(`Found ${refs.length} blob-hosted image reference(s) to migrate`)

  let migrated = 0
  let failed = 0

  for (const ref of refs) {
    const originalUrl = ref.url
    const fileName = fileNameFromUrl(originalUrl)
    const subdir = ref.table.toLowerCase()

    try {
      console.log(`Migrating ${ref.table}.${ref.field} (${ref.id}): ${originalUrl}`)
      const res = await fetch(originalUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = res.headers.get('content-type') || 'application/octet-stream'

      const staticUrl = await saveUploadedFile(buffer, fileName, contentType, subdir)
      await updateRecord(ref, staticUrl)

      if (DELETE_SOURCE_BLOB) {
        await deleteUploadedFile(originalUrl)
      }

      migrated++
      console.log(`  → ${staticUrl}`)
    } catch (err) {
      failed++
      console.error(`  FAILED: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${failed} failed`)
  if (!DELETE_SOURCE_BLOB) {
    console.log('Source blob objects were NOT deleted. Set DELETE_SOURCE_BLOB=true to delete them.')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
