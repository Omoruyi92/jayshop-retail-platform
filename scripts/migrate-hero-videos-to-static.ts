/**
 * One-time migration: download hero VIDEO slides hosted on Vercel Blob and
 * re-upload them to public/hero-videos/<scope>/ as static assets.
 *
 * Run with:
 *   npx tsx scripts/migrate-hero-videos-to-static.ts
 *
 * Requires DATABASE_URL and (temporarily) readable blob URLs. The script
 * updates the HeroSlide.url field in place and deletes the source blob object
 * after the local file is written successfully.
 */
import { prisma } from '../src/lib/prisma'
import { isBlobUpload } from '../src/lib/media/upload'
import { saveHeroVideo, deleteUploadedFile } from '../src/lib/media/server/upload.server'

const SCOPES = ['HOME', 'SHOP', 'STYLE_LANDING', 'PLAYERS', 'GALLERY'] as const

async function main() {
  const slides = await prisma.heroSlide.findMany({
    where: {
      mediaType: 'VIDEO',
      url: { startsWith: 'https://' },
    },
    orderBy: { createdAt: 'asc' },
  })

  const blobVideos = slides.filter((s) => isBlobUpload(s.url))
  console.log(`Found ${blobVideos.length} blob-hosted hero video(s) to migrate`)

  let migrated = 0
  let failed = 0

  for (const slide of blobVideos) {
    const scope = SCOPES.includes(slide.scope as any) ? slide.scope : 'HOME'
    const originalUrl = slide.url
    const fileName = originalUrl.split('/').pop() || `${Date.now()}.mp4`
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')

    try {
      console.log(`Migrating ${slide.id} (${scope}): ${originalUrl}`)
      const res = await fetch(originalUrl)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const arrayBuffer = await res.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const staticUrl = await saveHeroVideo(buffer, cleanName, scope.toLowerCase())

      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: { url: staticUrl },
      })

      await deleteUploadedFile(originalUrl)

      migrated++
      console.log(`  → ${staticUrl}`)
    } catch (err) {
      failed++
      console.error(`  FAILED: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${failed} failed`)
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
