import { NextRequest, NextResponse } from 'next/server'

import { getBackendUrl } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backendUrl = `${getBackendUrl()}/api/geocode?${searchParams.toString()}`
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.ok ? 200 : response.status })
  } catch (error) {
    console.error('Geocode API proxy error:', error)
    return NextResponse.json(
      { ok: false, error: 'Geocoding failed' },
      { status: 500 }
    )
  }
}
