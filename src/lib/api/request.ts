import { NextResponse } from 'next/server'

/**
 * Thrown when a request fails validation (missing/incorrect Content-Type,
 * empty body, malformed JSON/form-data, or a malformed JSON sub-field).
 * Route handlers should catch this (or use `apiErrorResponse`) and return
 * a clean 400 instead of letting a raw parse exception bubble into a 500.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

/**
 * Safely parses a JSON request body. Throws BadRequestError (never a raw
 * SyntaxError) when the Content-Type is wrong, the body is empty, or the
 * JSON is malformed.
 */
export async function parseJsonBody<T = unknown>(req: Request): Promise<T> {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new BadRequestError('Content-Type must be application/json')
  }
  let text: string
  try {
    text = await req.text()
  } catch {
    throw new BadRequestError('Failed to read request body')
  }
  if (!text || !text.trim()) {
    throw new BadRequestError('Request body is required')
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new BadRequestError('Request body must be valid JSON')
  }
}

/**
 * Safely parses a multipart/form-data request. Throws BadRequestError
 * (never a raw exception) on a wrong Content-Type or malformed form data.
 */
export async function parseFormData(req: Request): Promise<FormData> {
  const contentType = req.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    throw new BadRequestError('Content-Type must be multipart/form-data')
  }
  try {
    return await req.formData()
  } catch {
    throw new BadRequestError('Malformed form data')
  }
}

/** Parses a JSON string field (e.g. a formData value), converting parse failures into BadRequestError. */
export function parseJsonField<T = unknown>(raw: string, fieldName: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new BadRequestError(`${fieldName} must be valid JSON`)
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Standard catch-block handler for admin API routes: turns validation
 * failures (BadRequestError) into clean 400s with a useful message, and
 * everything else into a generic 500 (logged server-side).
 */
export function apiErrorResponse(err: unknown, fallbackMessage = 'Internal server error') {
  if (err instanceof BadRequestError) {
    return badRequest(err.message)
  }
  console.error(err)
  return NextResponse.json({ error: fallbackMessage }, { status: 500 })
}
