"use client"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/listing-card"
import { useSearchParams, useRouter } from "next/navigation"
import React, { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { Filter, Grid, List, Search, SlidersHorizontal, X } from "lucide-react"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import dynamic from "next/dynamic"
import { AdSection } from "@/components/ad-section"
import { CtaAddBusiness } from "@/components/cta-add-business"
import { cities as mockCities } from "@/lib/mock-data"
import { useUserLocation, parseNearMeQuery } from "@/hooks/use-user-location"

// Client-only wrapper to prevent hydration issues
const ClientOnlySelect = dynamic(() => Promise.resolve(({ value, onValueChange, children, className, placeholder }: any) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={className}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    {children}
  </Select>
)), { ssr: false })

const ClientOnlyInput = dynamic(() => Promise.resolve(({ className, ...props }: any) => (
  <input className={className} {...props} />
)), { ssr: false })

type Business = {
  id: string
  _id?: string
  slug?: string
  name: string
  category: string
  city: string
  address: string
  description: string
  logo?: string
  logoUrl?: string
  logoPublicId?: string
  imageUrl?: string
  phone?: string
  email?: string
  status?: "pending" | "approved" | "rejected"
  distanceKm?: number
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [fetchedOnce, setFetchedOnce] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('relevance')
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const query = searchParams.get("q") || ""
  const city = searchParams.get("city") || ""
  const category = searchParams.get("category") || ""
  const status = searchParams.get("status") || ""
  const limit = 20
  const { location: userLocation, loading: locationLoading } = useUserLocation()
  const { nearMe: nearMeIntent, searchTerm } = parseNearMeQuery(query)
  const useNearby = nearMeIntent && !!userLocation

  const [cities] = useState<Array<{ id: string; name: string; slug: string }>>(() =>
    mockCities.map((c) => ({ id: c.slug, name: c.name, slug: c.slug }))
  )
  const [categoriesList, setCategoriesList] = useState<Array<{ slug: string; name: string }>>([])
  const [showAllCategories, setShowAllCategories] = useState(Boolean(searchParams.get("allCategories")))
  const [showAllCities, setShowAllCities] = useState(true)

  useEffect(() => {
    setCurrentPage(1)
    setBusinesses([])
  }, [query, city, category])

  useEffect(() => {
    const controller = new AbortController()
    const fetchData = async () => {
      try {
        setError("")
        const initialLoad = currentPage === 1
        setIsLoading(initialLoad)
        setIsFetchingMore(!initialLoad)
        if (initialLoad) setFetchedOnce(false)

        if (useNearby && userLocation && currentPage === 1) {
          const params = new URLSearchParams()
          params.set("lat", String(userLocation.lat))
          params.set("lng", String(userLocation.lng))
          params.set("limit", String(limit))
          if (searchTerm) params.set("q", searchTerm)
          if (category) params.set("category", category)
          const res = await fetch(`/api/business/nearby?${params.toString()}`, { cache: "no-store", signal: controller.signal })
          const data = await res.json().catch(() => ({}))
          if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load nearby")
          const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          const items: Business[] = (data.businesses || []).map((b: any) => ({
            id: b.id || b._id?.toString?.() || "",
            slug: b.slug,
            name: b.name,
            category: b.category,
            city: b.city,
            address: b.address,
            description: b.description,
            logo: b.logo,
            logoUrl: b.logoUrl || (b.logoPublicId && cloud ? `https://res.cloudinary.com/${cloud}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${String(b.logoPublicId).trim()}` : undefined),
            logoPublicId: b.logoPublicId,
            imageUrl: b.imageUrl,
            phone: b.phone,
            email: b.email,
            status: b.status,
            distanceKm: b.distanceKm,
          }))
          setBusinesses(items)
          setTotal(items.length)
          setTotalPages(1)
        } else if (!useNearby || !nearMeIntent) {
          const params = new URLSearchParams()
          params.set("page", String(currentPage))
          params.set("limit", String(limit))
          if (query.trim()) params.set("q", query.trim())
          if (city.trim()) params.set("city", city.trim())
          if (category.trim()) params.set("category", category.trim())
          if (status.trim()) params.set("status", status.trim())
          const res = await fetch(`/api/business?${params.toString()}`, { cache: "no-store", signal: controller.signal })
          const ct = res.headers.get('content-type') || ''
          let data: any = null
          if (ct.includes('application/json')) {
            data = await res.json()
          } else {
            const txt = await res.text()
            throw new Error(txt || `Server ${res.status} ${res.statusText}`)
          }
          if (!res.ok || !data?.ok) throw new Error(data?.error || `Server ${res.status} ${res.statusText}`)
          const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          const items: Business[] = (data.businesses || []).map((b: any) => {
            const cleanLogoId = (b.logoPublicId || "").trim().replace(/^\/+/, "").replace(/\/+/g, "/")
            const derivedLogoUrl = (!b.logoUrl && cleanLogoId && cloud)
              ? `https://res.cloudinary.com/${cloud}/image/upload/c_fit,w_200,h_200,q_auto,f_auto/${cleanLogoId}`
              : undefined
            return {
              id: b.id || b._id?.toString?.() || "",
              slug: b.slug,
              name: b.name,
              category: b.category,
              city: b.city,
              address: b.address,
              description: b.description,
              logo: b.logo,
              logoUrl: b.logoUrl || derivedLogoUrl,
              logoPublicId: b.logoPublicId,
              imageUrl: b.imageUrl,
              phone: b.phone,
              email: b.email,
              status: b.status,
              distanceKm: b.distanceKm,
            }
          })
          setBusinesses((prev) => currentPage === 1 ? items : prev.concat(items))
          const pagination = data?.pagination || {}
          const totalCount = pagination.total ?? items.length
          const pagesCount = pagination.pages ?? (Math.ceil(totalCount / limit) || 1)
          setTotal(totalCount)
          setTotalPages(pagesCount)
        } else {
          setBusinesses([])
          setTotal(0)
          setTotalPages(1)
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e?.message || "Failed to load listings")
        if (currentPage === 1) setBusinesses([])
        setTotal(0)
        setTotalPages(1)
      } finally {
        setIsLoading(false)
        setIsFetchingMore(false)
        setFetchedOnce(true)
      }
    }
    if (nearMeIntent && !userLocation && !locationLoading) {
      setFetchedOnce(true)
      setIsLoading(false)
      setBusinesses([])
      setTotal(0)
      setTotalPages(1)
    } else {
      fetchData()
    }
    return () => controller.abort()
  }, [query, city, category, status, currentPage, useNearby, userLocation, nearMeIntent, searchTerm, locationLoading])

  const hasMore = useMemo(() => currentPage < totalPages, [currentPage, totalPages])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting) {
        if (!isLoading && !isFetchingMore && hasMore) {
          setCurrentPage((p) => (p < totalPages ? p + 1 : p))
        }
      }
    }, { root: null, rootMargin: '300px', threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoading, isFetchingMore, totalPages])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const catRes = await fetch('/api/categories?limit=200&nocache=1', { cache: 'no-store' })
        const categoriesJson = await catRes.json().catch(() => ({}))
        if (alive) {
          const catList: Array<{ slug: string; name: string }> = Array.isArray(categoriesJson?.categories)
            ? categoriesJson.categories.map((x: any) => ({ slug: x.slug, name: x.name || x.slug }))
            : []
          setCategoriesList(catList)
        }
      } catch {
        if (alive) setCategoriesList([])
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    setShowAllCategories(Boolean(searchParams.get("allCategories")))
  }, [searchParams])

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  const displayedCategories = useMemo(() => (
    showAllCategories ? categoriesList : categoriesList.slice(0, 8)
  ), [categoriesList, showAllCategories])

  const displayedCities = useMemo(() => (
    showAllCities ? cities : cities.slice(0, 8)
  ), [cities, showAllCities])

  const [citySearch, setCitySearch] = useState("")
  const [searchInput, setSearchInput] = useState(query)
  const searchInputRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  const setSearchQueryLive = (value: string) => {
    setSearchInput(value)
    if (searchInputRef.current) clearTimeout(searchInputRef.current)
    searchInputRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (value.trim()) params.set("q", value.trim())
      else params.delete("q")
      params.delete("page")
      router.push(`/search?${params.toString()}`, { scroll: false })
      searchInputRef.current = null
    }, 300)
  }

  const resultsList = useMemo(() => {
    const out: React.ReactNode[] = []
    businesses.forEach((b, index) => {
      if (index > 0 && index % 4 === 0) {
        out.push(<div key={`ad-${index}`} className={viewMode === 'grid' ? 'md:col-span-2 lg:col-span-3' : ''}><AdSection slotId="search-inline-ad" className="my-6" /></div>)
      }
      out.push(
        <div key={b.id} className={viewMode === 'grid' ? '' : 'border-b border-gray-100 last:border-b-0'}>
          <ListingCard business={b} variant={viewMode === 'list' ? 'compact' : 'card'} />
        </div>
      )
    })
    return out
  }, [businesses, viewMode])

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: query ? `Search: ${query}` : "Browse Businesses", url: query ? `/search?q=${encodeURIComponent(query)}` : "/search" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbSchema items={breadcrumbItems} />
      {/* Header Section - One H1 per page */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-gray-900">{query ? "Search Results" : "Browse Businesses"}</span>
          </nav>
          {/* Live search: per-letter filter – updates URL debounced so results refetch */}
          <div className="mb-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search businesses (e.g. D, Doctor, Restaurant)..."
                value={searchInput}
                onChange={(e) => setSearchQueryLive(e.target.value)}
                className="pl-10 h-11 rounded-lg border-gray-200 bg-white"
                aria-label="Search businesses"
              />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 break-words">
                {query ? `Search Results for "${query}" in Pakistan` : "Browse Businesses in Pakistan"}
              </h1>
                <p className="text-sm sm:text-base text-gray-600">
                {nearMeIntent && userLocation && <span className="font-medium text-primary">Showing businesses near you. </span>}
                {nearMeIntent && !userLocation && !locationLoading && <span className="text-amber-700">Allow location to see nearby results, or search without &quot;near me&quot;. </span>}
                {total > 0 ? `Showing ${businesses.length} of ${total.toLocaleString()} businesses` : "Browse businesses"}
                {city && !useNearby && <span> in {city.charAt(0).toUpperCase() + city.slice(1)}</span>}
                {category && <span> in {category.replace(/-/g, " ")}</span>}
              </p>
            </div>
            
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            
            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Sort Dropdown */}
              <ClientOnlySelect 
                value={sortBy} 
                onValueChange={setSortBy}
                className="w-40"
                placeholder="Sort by"
              >
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviewed</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </ClientOnlySelect>

              {/* View Toggle */}
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
              </div>

            {/* Mobile Sort and View Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <ClientOnlySelect 
                value={sortBy} 
                onValueChange={setSortBy}
                className="flex-1 h-9 text-sm"
                placeholder="Sort by"
              >
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviewed</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </ClientOnlySelect>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-2"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      {showFilters && (
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Mobile Category Filters */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Categories</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateParam('category','')}
                className={`filter-chip ${!category ? 'filter-chip-active' : ''}`}
              >
                All Categories
              </button>
              {categoriesList.slice(0, 10).map((c) => {
                const active = category === c.slug
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => updateParam('category', active ? '' : c.slug)}
                    className={`filter-chip ${active ? 'filter-chip-active' : ''}`}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mobile City Filters */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Cities</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateParam('city','')}
                className={`filter-chip ${!city ? 'filter-chip-active' : ''}`}
              >
                All Cities
              </button>
              {cities.map((ct) => {
                const active = city === ct.slug || city.toLowerCase() === ct.name.toLowerCase()
                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => updateParam('city', active ? '' : ct.slug)}
                    className={`filter-chip ${active ? 'filter-chip-active' : ''}`}
                  >
                    {ct.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Results */}
          <section className="lg:col-span-3 lg:order-1">
            {isLoading && (
              <div className="flex flex-col sm:flex-row items-center justify-center py-12 sm:py-16 gap-3">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                <span className="text-sm sm:text-base text-gray-600">Loading businesses...</span>
              </div>
            )}
            
            {error && (
              <div className="text-center text-red-600 py-6 sm:py-8 bg-red-50 rounded-lg border border-red-200 px-4">
                <p className="text-sm sm:text-base">{error}</p>
              </div>
            )}
            
            {!isLoading && !error && businesses.length > 0 ? (
              <>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" 
                  : "bg-card border border-border rounded-xl shadow-md divide-y divide-gray-100"
                }>
                  {resultsList}
                </div>

                <CtaAddBusiness className="my-6 sm:my-8" />
                
                <div ref={sentinelRef} className="min-h-[120px] flex flex-col items-center justify-center py-8 gap-4">
                  {isFetchingMore ? (
                    <div className="flex justify-center items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      <span className="text-gray-600">Loading more businesses...</span>
                    </div>
                  ) : hasMore && !isLoading ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => (p < totalPages ? p + 1 : p))}
                    >
                      Load more businesses
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}
            
            {!isLoading && !error && fetchedOnce && businesses.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or browse all businesses.</p>
                <Button asChild>
                  <Link href="/search">Browse All Businesses</Link>
                </Button>
              </div>
            )}
          </section>

          {/* Desktop Sidebar Filters - Right Side */}
          <aside className="hidden lg:block lg:order-2">
            <div className="bg-card border border-border rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 sm:p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Filters
              </h3>
              
              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {displayedCategories.map((c) => {
                    const checked = category === c.slug
                    return (
                      <label key={c.slug} className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={checked}
                          onChange={(e) => updateParam('category', e.target.checked ? c.slug : '')}
                        />
                        <span className="text-sm text-gray-700">{c.name}</span>
                      </label>
                    )
                  })}
                </div>
                {categoriesList.length > 8 && (
                  <button onClick={() => setShowAllCategories((v) => !v)} className="mt-3 text-sm text-primary hover:underline">
                    {showAllCategories ? 'Show Less' : `View All (${categoriesList.length - 8} more)`}
                  </button>
                )}
              </div>

              {/* Cities */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Cities</h4>
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <ClientOnlyInput
                      type="text"
                      placeholder="Search cities..."
                      value={citySearch}
                      onChange={(e: any) => setCitySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {displayedCities
                    .filter((ct) => !citySearch || ct.name.toLowerCase().includes(citySearch.toLowerCase()))
                    .map((ct) => {
                      const active = city === ct.slug || city.toLowerCase() === ct.name.toLowerCase()
                      return (
                        <label key={ct.id} className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={active}
                            onChange={(e) => updateParam('city', e.target.checked ? ct.slug : '')}
                          />
                          <span className="text-sm text-gray-700">{ct.name}</span>
                        </label>
                      )
                    })}
                </div>
                {cities.length > 8 && (
                  <button onClick={() => setShowAllCities((v) => !v)} className="mt-3 text-sm text-primary hover:underline">
                    {showAllCities ? 'Show Less' : `View All (${cities.length - 8} more)`}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}