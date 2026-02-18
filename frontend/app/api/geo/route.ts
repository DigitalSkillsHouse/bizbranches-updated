import { NextRequest, NextResponse } from 'next/server'

/**
 * Returns approximate user lat/lng from IP (fallback when browser geolocation is denied).
 * Uses ip-api.com (free, 45 req/min). Store in session only; do not log.
 */
export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined
    const url = ip
      ? `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=lat,lon,status`
      : 'http://ip-api.com/json?fields=lat,lon,status'
    const res = await fetch(url, { next: { revalidate: 0 }, signal: AbortSignal.timeout(4000) })
    const data = await res.json().catch(() => ({}))
    if (data?.status === 'success' && Number.isFinite(data?.lat) && Number.isFinite(data?.lon)) {
      return NextResponse.json({ ok: true, lat: data.lat, lng: data.lon })
    }
    return NextResponse.json({ ok: false, error: 'Could not determine location' }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Location unavailable' }, { status: 200 })
  }
}
