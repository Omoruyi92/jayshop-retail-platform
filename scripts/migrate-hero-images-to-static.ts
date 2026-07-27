/**
 * One-time migration: download hero IMAGE slides hosted on Vercel Blob and
 * save them to public/uploads/hero-slides/<scope>/ as static assets.
 *
 * Run with:
 *   DATABASE_URL=... npx tsx scripts/migrate-hero-images-to-static.ts
 */
import { prisma } from '../src/lib/prisma'
import { isBlobUpload } from '../src/lib/media/upload'
import { saveUploadedFile, deleteUploadedFile } from '../src/lib/media/server/upload.server'

const DELETE_SOURCE_BLOB = process.env.DELETE_SOURCE_BLOB === 'true'

function fileNameFromUrl(url: string): string {
  const base = url.split('/').pop() || `${Date.now()}`
  return base.split('?')[0].replace(/[^a-zA-Z0-9._-]/g, '_') || `${Date.now()}.bin`
}

async function main() {
  const slides = await prisma.heroSlide.findMany({
    where: { mediaType: 'IMAGE' },
  })
  const blobImages = slides.filter((s) => isBlobUpload(s.url))
  console.log(`Found ${blobImages.length} blob-hosted hero image(s) to migrate`)

  let migrated = 0
  let failed = 0

  for (const slide of blobImages) {
    const scope = slide.scope.toLowerCase()
    const originalUrl = slide.url
    const fileName = fileNameFromUrl(originalUrl)

    try {
      console.log(`Migrating ${slide.id} (${slide.scope}): ${originalUrl}`)
      const res = await fetch(originalUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get('content-type') || 'application/octet-stream'

      const staticUrl = await saveUploadedFile(buffer, fileName, contentType, `hero-slides/${scope}`)
      await prisma.heroSlide.update({ where: { id: slide.id }, data: { url: staticUrl } })

      if (DELETE_SOURCE_BLOB) await deleteUploadedFile(originalUrl)

      migrated++
      console.log(`  → ${staticUrl}`)
    } catch (err) {
      failed++
      console.error(`  FAILED: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${failed} failed`)
  if (!DELETE_SOURCE_BLOB) console.log('Source blob objects were NOT deleted.')
}

main()
  .then(async () => { await prisma.$disconnect(); process.exit(0) })
  .catch(async (err) => { console.error(err); await prisma.$disconnect(); process.exit(1) })
