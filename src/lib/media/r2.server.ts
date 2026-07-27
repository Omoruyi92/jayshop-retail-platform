import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { nanoid } from 'nanoid'

/**
 * Cloudflare R2 server-side helpers.
 *
 * R2 is S3-compatible and offers a generous free tier:
 *   - 10 GB storage per month
 *   - No egress fees
 *   - ~1 million Class A operations / 10 million Class B operations per month
 *
 * Required environment variables:
 *   R2_ENDPOINT            e.g. https://<account-id>.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID       from Cloudflare R2 API token
 *   R2_SECRET_ACCESS_KEY   from Cloudflare R2 API token
 *   R2_BUCKET_NAME
 *   R2_PUBLIC_URL          public/custom domain where objects are served
 */

function getClient(): S3Client {
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.')
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME
  if (!bucket) throw new Error('Missing R2_BUCKET_NAME')
  return bucket
}

function getPublicUrl(): string {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!publicUrl) throw new Error('Missing R2_PUBLIC_URL')
  return publicUrl.replace(/\/$/, '')
}

/** Matches a URL served from the configured R2 public domain. */
export function isR2Upload(url: string): boolean {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!publicUrl) return false
  return url.startsWith(publicUrl.replace(/\/$/, ''))
}

/**
 * Uploads a buffer to R2 and returns the public URL.
 */
export async function saveToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  subdir?: string
): Promise<string> {
  const key = subdir ? `${subdir}/${fileName}` : fileName
  const client = getClient()
  const bucket = getBucket()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return `${getPublicUrl()}/${key}`
}

/**
 * Best-effort delete of an R2 object by public URL.
 */
export async function deleteFromR2(url: string): Promise<void> {
  const publicUrl = getPublicUrl()
  if (!url.startsWith(publicUrl + '/')) return
  const key = url.slice(publicUrl.length + 1)

  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }))
  } catch {
    // ignore
  }
}

/**
 * Check whether an R2 object exists. Useful for diagnostics.
 */
export async function r2ObjectExists(url: string): Promise<boolean> {
  const publicUrl = getPublicUrl()
  if (!url.startsWith(publicUrl + '/')) return false
  const key = url.slice(publicUrl.length + 1)

  try {
    await getClient().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }))
    return true
  } catch {
    return false
  }
}

/**
 * Configure the bucket's CORS policy to allow direct browser PUT uploads from
 * the listed origins. This must be run once per R2 bucket (or whenever the
 * production/custom domain changes).
 */
export async function configureR2Cors(allowedOrigins: string[]): Promise<void> {
  const client = getClient()
  const bucket = getBucket()

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['PUT', 'POST'],
            AllowedOrigins: allowedOrigins,
            MaxAgeSeconds: 300,
          },
        ],
      },
    })
  )
}

/**
 * Generate a presigned URL that allows the browser to upload a file directly
 * to R2 via PUT. The URL is valid for `expiresInSeconds` (default 5 min).
 * Returns both the signed PUT URL and the final public URL where the object
 * will be served.
 */
export async function getPresignedR2UploadUrl(
  opts: {
    fileName: string
    contentType: string
    subdir?: string
    expiresInSeconds?: number
  }
): Promise<{ presignedUrl: string; publicUrl: string; key: string }> {
  const key = opts.subdir ? `${opts.subdir}/${opts.fileName}` : opts.fileName
  const client = getClient()
  const bucket = getBucket()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: opts.contentType,
  })

  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn: opts.expiresInSeconds ?? 300,
  })

  return { presignedUrl, publicUrl: `${getPublicUrl()}/${key}`, key }
}

/**
 * Build a unique hero video filename for a given scope.
 */
export function makeHeroVideoFileName(scope: string, ext: string): string {
  return `${scope}-${Date.now()}-${nanoid(8)}.${ext}`
}
