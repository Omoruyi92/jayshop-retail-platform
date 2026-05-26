import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/auth'
import { expireAllOverdueHolds } from '@/lib/holds/expireHolds'

export async function POST() {
  const { error } = await requireAdminSession()
  if (error) return error

  try {
    const result = await expireAllOverdueHolds()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[expire-holds-manual] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
