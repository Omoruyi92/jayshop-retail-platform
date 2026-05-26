import { NextResponse } from 'next/server'
import { readdirSync } from 'fs'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/auth'
import {
  isLocalUpload,
  extractFilename,
  uploadFileExists,
} from '@/lib/media/cleanup'

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads')

export async function GET() {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    // 1. List all files in the uploads directory (skip hidden/backup dirs)
    let allFiles: string[] = []
    try {
      allFiles = readdirSync(UPLOADS_DIR).filter(
        (f) => !f.startsWith('.') && !f.startsWith('_')
      )
    } catch {
      // uploads dir doesn't exist yet — treat as empty
    }

    // 2. Collect all DB references to local uploads
    const [products, history] = await Promise.all([
      prisma.product.findMany({ select: { id: true, name: true, imageUrl: true } }),
      prisma.holdHistory.findMany({
        select: { productImageUrlSnapshot: true },
      }),
    ])

    const referencedSet = new Set<string>()

    for (const p of products) {
      if (isLocalUpload(p.imageUrl)) {
        referencedSet.add(extractFilename(p.imageUrl))
      }
    }
    for (const h of history) {
      if (isLocalUpload(h.productImageUrlSnapshot)) {
        referencedSet.add(extractFilename(h.productImageUrlSnapshot))
      }
    }

    // 3. Compute orphans
    const orphans = allFiles.filter((f) => !referencedSet.has(f))
    const referencedFiles = allFiles.filter((f) => referencedSet.has(f))

    // 4. Find broken DB references (imageUrl points to a missing file)
    const brokenRefs: Array<{ productId: string; productName: string; missingFile: string }> = []
    for (const p of products) {
      if (isLocalUpload(p.imageUrl)) {
        const exists = await uploadFileExists(p.imageUrl)
        if (!exists) {
          brokenRefs.push({
            productId: p.id,
            productName: p.name,
            missingFile: p.imageUrl,
          })
        }
      }
    }

    return NextResponse.json({
      summary: {
        totalUploadFiles: allFiles.length,
        referencedFiles: referencedFiles.length,
        orphanCount: orphans.length,
        brokenDbRefs: brokenRefs.length,
        safeToDeleteCount: orphans.length,
      },
      orphans,
      brokenRefs,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Media audit failed' }, { status: 500 })
  }
}
