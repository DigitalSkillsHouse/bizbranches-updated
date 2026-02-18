"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [city, setCity] = useState(searchParams.get("city") || "all")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [citiesList, setCitiesList] = useState<Array<{ value: string; label: string }>>([])
  const [loadingCities, setLoadingCities] = useState(true)

  // Load cities from API
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoadingCities(true)
        const res = await fetch('/api/cities', { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))
        const list: Array<{ id: string; name: string }> = Array.isArray(data?.cities) ? data.cities : []
        if (alive) {
          const mapped = list.map(c => ({ value: c.name.toLowerCase().replace(/\s+/g, '-'), label: c.name }))
          setCitiesList(mapped)
        }
      } catch {
        if (alive) setCitiesList([])
      } finally {
        if (alive) setLoadingCities(false)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/categories?limit=200`, { cache: "no-store" })
        const data = await res.json()
        if (active && data?.ok && Array.isArray(data.categories)) {
          const mapped = data.categories.map((c: any) => ({ value: c.slug, label: c.name || c.slug }))
          setCategories(mapped)
        }
      } catch {
        // keep empty on error
      } finally {
        if (active) setLoadingCats(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (query.trim()) params.set("q", query.trim())
    if (city !== "all") params.set("city", city)
    if (category !== "all") params.set("category", category)

    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    setQuery("")
    setCity("all")
    setCategory("all")
    router.push("/search")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Search</label>
          <Input placeholder="Business name or keyword..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">City</label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger>
              <SelectValue placeholder={loadingCities ? "Loading cities..." : "All Cities"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {!loadingCities && citiesList.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {!loadingCats && categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col space-y-2">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
          <Button onClick={clearFilters} variant="outline" className="w-full bg-transparent">
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
