import { NextRequest, NextResponse } from 'next/server'

import { getBackendUrl } from '@/lib/api'

export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const backendUrl = `${getBackendUrl()}/api/business?${searchParams.toString()}`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Business API proxy error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch businesses' },
      { status: 500 }
    )
  }
}

/** POST /api/business – proxy Add Business form (FormData) to backend */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const backendUrl = `${getBackendUrl()}/api/business`
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      // Do not set Content-Type – fetch sets multipart/form-data with boundary
    })
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: response.status })
    } catch {
      return new NextResponse(text, { status: response.status })
    }
  } catch (error) {
    const err = error as Error
    console.error('Business POST proxy error:', err?.message || err)
    const message =
      err?.message?.includes('fetch') || err?.message?.includes('ECONNREFUSED') || err?.message?.includes('ENOTFOUND')
        ? 'Server is unreachable. Please try again later or contact support.'
        : 'Failed to submit business. Please try again.'
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    )
  }
}