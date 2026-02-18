import { NextRequest } from "next/server"
import { getBackendUrl } from "@/lib/api"

export const dynamic = 'force-static'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country')
    const provinceId = searchParams.get('provinceId')
    const backendUrl = getBackendUrl()
    let url = `${backendUrl}/api/cities`
    
    const params = new URLSearchParams()
    if (country) params.set('country', country)
    if (provinceId) params.set('provinceId', provinceId)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.ok && Array.isArray(data.cities)) {
      return Response.json({ ok: true, cities: data.cities })
    } else {
      throw new Error('Invalid response from backend')
    }
  } catch (err: any) {
    console.error('Cities API error:', err)
    return Response.json({ ok: false, error: err?.message || "Failed to fetch cities from backend" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, country } = body
    
    if (!name || !country) {
      return Response.json({ ok: false, error: 'Name and country are required' }, { status: 400 })
    }
    
    const backendUrl = getBackendUrl()
    const response = await fetch(`${backendUrl}/api/cities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, country })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
      throw new Error(errorData.error || `Backend error: ${response.status}`)
    }
    
    const data = await response.json()
    return Response.json(data)
  } catch (err: any) {
    console.error('Add city API error:', err)
    return Response.json({ ok: false, error: err?.message || "Failed to add city" }, { status: 500 })
  }
}