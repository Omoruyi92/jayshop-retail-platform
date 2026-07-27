import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/authorize.server'
import { getPresignedR2UploadUrl, makeHeroVideoFileName } from '@/lib/media/r2.server'
import { apiErrorResponse, badRequest } from '@/lib/api/request'

export const dynamic = 'force-dynamic'

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const MAX_VIDEO_SIZE = 50 * 1024 * 1024
const VALID_SCOPES = ['HOME', 'SHOP', 'STYLE_LANDING', 'PLAYERS', 'GALLERY']

export async function GET(req: Request) {
  const { error } = await requireRole(req, 'gallery:write')
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get('fileName')
    const contentType = searchParams.get('contentType')
    const sizeRaw = searchParams.get('size')
    const scopeRaw = searchParams.get('scope')?.toUpperCase()

    if (!fileName || !contentType || !sizeRaw || !scopeRaw) {
      return badRequest('fileName, contentType, size, and scope are required')
    }

    if (!VALID_SCOPES.includes(scopeRaw)) {
      return badRequest('Invalid scope')
    }

    if (!VIDEO_TYPES.has(contentType)) {
      return badRequest('Only MP4 and WebM videos are supported')
    }

    const size = Number(sizeRaw)
    if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_SIZE) {
      return badRequest(`Video must be between 1 byte and ${MAX_VIDEO_SIZE} bytes`)
    }

    const ext = fileName.split('.').pop() || 'mp4'
    const uniqueName = makeHeroVideoFileName(scopeRaw.toLowerCase(), ext)

    const { presignedUrl, publicUrl } = await getPresignedR2UploadUrl({
      fileName: uniqueName,
      contentType,
      subdir: 'hero-videos',
      expiresInSeconds: 300,
    })

    return NextResponse.json({ presignedUrl, publicUrl, scope: scopeRaw })
  } catch (err) {
    return apiErrorResponse(err, 'Failed to create presigned upload URL')
  }
}
