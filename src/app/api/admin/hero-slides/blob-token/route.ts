import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { requireRole } from '@/lib/auth/authorize.server'

export const dynamic = 'force-dynamic'

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
]

/**
 * Vercel Blob client-upload token endpoint.
 *
 * Called internally by `@vercel/blob/client` `upload()`:
 *   1. Client POSTs `{ type: 'blob.generate-client-token', ... }` → we validate
 *      admin auth and return a short-lived client token scoped to the allowed
 *      media types and 50 MB max size.
 *   2. The client then uploads directly to Vercel Blob (no serverless body
 *      size limit applies), and we receive the blob URL to create the DB record
 *      via a follow-up POST to /api/admin/hero-slides.
 *
 * We intentionally skip `onUploadCompleted` (no callbackUrl set) because DB
 * record creation is handled client-side after `upload()` resolves.
 */
export async function POST(req: Request): Promise<Response> {
  let body: HandleUploadBody
  try {
    body = (await req.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Only gate the token-generation step behind admin auth. The upload-completed
  // callback (if ever sent) comes from Vercel infrastructure with no session.
  if ((body as { type?: string }).type === 'blob.generate-client-token') {
    const { error } = await requireRole(req, 'gallery:write')
    if (error) return error
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, _clientPayload) => {
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        // DB record is created by the client calling /api/admin/hero-slides
        // with the Blob URL after upload() resolves. Nothing to do here.
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    console.error('[blob-token] handleUpload error', err)
    return NextResponse.json({ error: 'Token generation failed' }, { status: 400 })
  }
}
