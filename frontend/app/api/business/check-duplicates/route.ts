import { NextRequest, NextResponse } from 'next/server'

import { getBackendUrl } from '@/lib/api'

export const dynamic = 'force-static'

/** POST /api/business/check-duplicates – proxy to backend for duplicate validation */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const res = await fetch(`${getBackendUrl()}/api/business/check-duplicates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }))
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    const err = error as Error
    console.error('Check-duplicates proxy error:', err?.message || err)
    return NextResponse.json(
      { ok: false, error: 'Server unreachable', hasDuplicates: false },
      { status: 500 }
    )
  }
}
