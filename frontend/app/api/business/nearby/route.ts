import { NextRequest, NextResponse } from 'next/server'

import { getBackendUrl } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backendUrl = `${getBackendUrl()}/api/business/nearby?${searchParams.toString()}`
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json(
        { ok: false, error: (err as { error?: string })?.error || 'Failed to fetch nearby businesses' },
        { status: response.status }
      )
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Nearby API proxy error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch nearby businesses' },
      { status: 500 }
    )
  }
}
