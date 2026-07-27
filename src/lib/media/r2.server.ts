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

/**
 * Cloudflare's dashboard "S3 API" field displays the endpoint with the bucket
 * name appended as a path suffix, e.g.
 *   https://<account-id>.r2.cloudflarestorage.com/<bucket-name>
 * but the AWS SDK's `endpoint` option must be the bucket-LESS origin — the SDK
 * appends the bucket itself (we use forcePathStyle, i.e. `/<bucket>/<key>`).
 * If a user pastes the dashboard value verbatim into R2_ENDPOINT, the bucket
 * name ends up duplicated in the final path (`/bucket/bucket/key`), which R2
 * rejects with a 400 (surfaced to the browser as a CORS failure since the
 * error response omits Access-Control-Allow-Origin).
 *
 * This strips a trailing `/<bucketName>` (and any trailing slash) so the app
 * tolerates both forms of the env var.
 */
function normalizeR2Endpoint(endpoint: string, bucket: string): string {
  const trimmed = endpoint.replace(/\/+$/, '')
  const suffix = `/${bucket}`
  if (trimmed.endsWith(suffix)) {
    const normalized = trimmed.slice(0, -suffix.length)
    // eslint-disable-next-line no-console
    console.warn(
      `[r2] R2_ENDPOINT included the bucket name ("${suffix}") as a path suffix; ` +
        `normalized to host-only endpoint. Update R2_ENDPOINT to avoid this warning.`
    )
    return normalized
  }
  return trimmed
}

function getClient(): S3Client {
  const rawEndpoint = process.env.R2_ENDPOINT?.trim()
  // Trim defensively: a stray trailing newline/whitespace pasted into the
  // Vercel dashboard (common copy-paste artifact) survives into these values
  // verbatim. For actual (non-presigned) SDK calls this ends up in the
  // Authorization header and Node's setHeader throws ERR_INVALID_CHAR. For
  // presigned URLs it silently corrupts the computed signature instead,
  // which R2 rejects with an auth error that (unlike CORS preflight) carries
  // no Access-Control-Allow-Origin header -- surfacing in the browser as a
  // misleading "blocked by CORS policy" failure.
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()

  if (!rawEndpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.')
  }

  const endpoint = normalizeR2Endpoint(rawEndpoint, getBucket())

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    // AWS SDK v3 >=3.729 defaults to WHEN_SUPPORTED, which proactively adds an
    // x-amz-checksum-crc32 header to presigned PutObjectCommands. Since no Body
    // is provided when presigning (the browser uploads it later), the SDK hashes
    // an empty payload and bakes that checksum into the signature. R2 then
    // rejects the real upload because the checksum doesn't match. WHEN_REQUIRED
    // stops the SDK from attaching checksums unless explicitly requested.
    requestChecksumCalculation: 'WHEN_REQUIRED',
  })
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME?.trim()
  if (!bucket) throw new Error('Missing R2_BUCKET_NAME')
  return bucket
}

function getPublicUrl(): string {
  const publicUrl = process.env.R2_PUBLIC_URL?.trim()
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
