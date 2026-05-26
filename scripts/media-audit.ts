#!/usr/bin/env tsx
/**
 * Jays Shop — Media Audit & Cleanup Script
 *
 * Usage:
 *   npm run media:audit            # dry-run: prints orphans, no changes
 *   npm run media:cleanup          # execute: moves orphans to .orphan-backup/<timestamp>/
 *
 * Permanent purge (after verifying shop works):
 *   rm -rf public/uploads/.orphan-backup/
 *
 * Rollback:
 *   cp -r public/uploads/.orphan-backup/<timestamp>/* public/uploads/
 */

import { PrismaClient } from '@prisma/client'
import { readdirSync } from 'fs'
import { mkdir, rename } from 'fs/promises'
import { join } from 'path'
import {
  isLocalUpload,
  extractFilename,
  resolveUploadPath,
  uploadFileExists,
} from '../src/lib/media/cleanup'

const prisma = new PrismaClient()

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads')
const BACKUP_DIR_NAME = '.orphan-backup'
const EXECUTE_FLAG = process.argv.includes('--execute')

// ── helpers ──────────────────────────────────────────────────────────────────

function getAllUploadFiles(): string[] {
  try {
    return readdirSync(UPLOADS_DIR).filter(
      (f) => !f.startsWith('.') && !f.startsWith('_')
    )
  } catch {
    console.error(`ERROR: Cannot read uploads directory: ${UPLOADS_DIR}`)
    process.exit(1)
  }
}

async function buildReferenceSet(): Promise<Set<string>> {
  const [products, history] = await Promise.all([
    prisma.product.findMany({ select: { imageUrl: true } }),
    prisma.holdHistory.findMany({ select: { productImageUrlSnapshot: true } }),
  ])

  const refs = new Set<string>()

  for (const p of products) {
    if (isLocalUpload(p.imageUrl)) {
      refs.add(extractFilename(p.imageUrl))
    }
  }

  for (const h of history) {
    if (isLocalUpload(h.productImageUrlSnapshot)) {
      refs.add(extractFilename(h.productImageUrlSnapshot))
    }
  }

  return refs
}

async function findBrokenRefs(): Promise<
  Array<{ id: string; name: string; imageUrl: string }>
> {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, imageUrl: true },
  })

  const broken: Array<{ id: string; name: string; imageUrl: string }> = []
  for (const p of products) {
    if (isLocalUpload(p.imageUrl)) {
      const exists = await uploadFileExists(p.imageUrl)
      if (!exists) broken.push(p)
    }
  }
  return broken
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== JAYS SHOP — MEDIA AUDIT ===')
  console.log(`Mode: ${EXECUTE_FLAG ? 'EXECUTE (move orphans to backup)' : 'DRY-RUN (no changes)'}`)
  console.log(`Upload directory: ${UPLOADS_DIR}\n`)

  // 1. Collect all files on disk
  const allFiles = getAllUploadFiles()
  console.log(`Files on disk:           ${allFiles.length}`)

  // 2. Build reference set from DB
  const referencedFiles = await buildReferenceSet()
  console.log(`Referenced (product):    ${referencedFiles.size} unique local files`)

  // 3. Compute orphans and active files
  const orphans = allFiles.filter((f) => !referencedFiles.has(f))
  const active = allFiles.filter((f) => referencedFiles.has(f))

  console.log(`Active files:            ${active.length}`)
  console.log(`Orphan files:            ${orphans.length}`)

  // 4. Find broken DB references (imageUrl points to missing file)
  const brokenRefs = await findBrokenRefs()

  // ── Report ──────────────────────────────────────────────────────────────
  console.log('\n─── ORPHANS ─────────────────────────────────────────────────')
  if (orphans.length === 0) {
    console.log('  None — all upload files are referenced.')
  } else {
    orphans.forEach((f) => console.log(`  - ${f}`))
  }

  console.log('\n─── BROKEN DB REFERENCES ────────────────────────────────────')
  if (brokenRefs.length === 0) {
    console.log('  None — all local imageUrl paths exist on disk.')
  } else {
    brokenRefs.forEach((p) =>
      console.log(`  - Product "${p.name}" (${p.id}) → ${p.imageUrl}`)
    )
  }

  // ── Execute: move orphans to backup ──────────────────────────────────────
  if (EXECUTE_FLAG && orphans.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = join(UPLOADS_DIR, BACKUP_DIR_NAME, timestamp)

    console.log(`\n─── MOVING ORPHANS TO BACKUP ────────────────────────────────`)
    console.log(`  Backup dir: ${backupDir}`)

    await mkdir(backupDir, { recursive: true })

    let moved = 0
    for (const filename of orphans) {
      const src = resolveUploadPath(filename)
      const dest = join(backupDir, filename)
      try {
        await rename(src, dest)
        console.log(`  Moved: ${filename}`)
        moved++
      } catch (err: unknown) {
        console.error(`  ERROR moving ${filename}:`, err)
      }
    }

    console.log(`\n  ${moved}/${orphans.length} files moved to backup.`)
    console.log(`\n  To permanently purge:\n    rm -rf "${join(UPLOADS_DIR, BACKUP_DIR_NAME)}"`)
    console.log(`\n  To rollback:\n    cp -r "${backupDir}"/* "${UPLOADS_DIR}/"`)
  } else if (EXECUTE_FLAG && orphans.length === 0) {
    console.log('\n  Nothing to move — no orphans found.')
  } else if (!EXECUTE_FLAG && orphans.length > 0) {
    console.log(`\n  Run with --execute (npm run media:cleanup) to move these files to backup.`)
  }

  console.log('\n=== AUDIT COMPLETE ===\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
