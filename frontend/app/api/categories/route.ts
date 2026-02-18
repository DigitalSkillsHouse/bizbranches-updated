import { NextRequest } from "next/server"
import { getBackendUrl } from "@/lib/api"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const q = searchParams.get('q')
    const limit = searchParams.get('limit')
    const backendUrl = getBackendUrl()
    let url = `${backendUrl}/api/categories`
    
    const params = new URLSearchParams()
    if (slug) params.set('slug', slug)
    if (q) params.set('q', q)
    if (limit) params.set('limit', limit)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    
    try {
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
      return Response.json(data)
    } catch (fetchError) {
      // Fallback to static data if backend is unavailable
      console.warn('Backend unavailable, using static categories:', fetchError)
      
      const staticCategories = [
        { slug: "restaurants", name: "Restaurants", icon: "🍽️" },
        { slug: "hotels", name: "Hotels", icon: "🏨" },
        { slug: "shopping", name: "Shopping", icon: "🛍️" },
        { slug: "healthcare", name: "Healthcare", icon: "🏥" },
        { slug: "automotive", name: "Automotive", icon: "🚗" },
        { slug: "beauty", name: "Beauty & Spa", icon: "💄" },
        { slug: "education", name: "Education", icon: "📚" },
        { slug: "fitness", name: "Fitness", icon: "💪" },
        { slug: "real-estate", name: "Real Estate", icon: "🏠" },
        { slug: "technology", name: "Technology", icon: "💻" },
        { slug: "finance", name: "Finance", icon: "💰" },
        { slug: "legal", name: "Legal Services", icon: "⚖️" },
        { slug: "entertainment", name: "Entertainment", icon: "🎭" },
        { slug: "travel", name: "Travel", icon: "✈️" },
        { slug: "home-services", name: "Home Services", icon: "🔧" }
      ]
      
      let filtered = staticCategories
      
      if (q) {
        filtered = staticCategories.filter(cat => 
          cat.name.toLowerCase().includes(q.toLowerCase()) ||
          cat.slug.toLowerCase().includes(q.toLowerCase())
        )
      }
      
      if (slug) {
        const category = staticCategories.find(cat => cat.slug === slug)
        if (category) {
          return Response.json({ 
            ok: true, 
            category: { 
              ...category, 
              subcategories: [] 
            } 
          })
        }
      }
      
      const result = filtered.slice(0, parseInt(limit || '50'))
      return Response.json({ ok: true, categories: result })
    }
  } catch (err: any) {
    console.error('Categories API error:', err)
    return Response.json({ ok: false, error: err?.message || "Failed to fetch categories" }, { status: 500 })
  }
}