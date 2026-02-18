"use client"
import React, { Suspense } from "react"
import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ListingCard } from "@/components/listing-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdSection } from "@/components/ad-section"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"

type ListBusiness = {
  id: string
  slug: string
  name: string
  category: string
  subCategory?: string
  city: string
  address: string
  description: string
  logo?: string
  logoUrl?: string
  phone?: string
  email?: string
  status?: "pending" | "approved" | "rejected"
}

type Category = { slug: string; name: string; subcategories?: Array<{ name: string; slug: string }> }

export default function CityPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const citySlug = params.slug as string
  const cityName = useMemo(() => {
    try {
      // Fallback: capitalize slug words
      return citySlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    } catch { return citySlug }
  }, [citySlug])

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all")
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([])
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(searchParams.get("subcategory") || "all")

  const [businesses, setBusinesses] = useState<ListBusiness[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>("")

  const [page, setPage] = useState<number>(parseInt(searchParams.get("page") || "1"))
  const limit = 12
  const [totalPages, setTotalPages] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null)

  // Fetch categories for filters
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories?limit=100", { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        const list: Category[] = Array.isArray(data?.categories) ? data.categories : []
        setCategories(list.map((c: any) => ({ slug: c.slug || "", name: c.name || c.slug || "", subcategories: c.subcategories || [] })))
      } catch (_) {
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  // Fetch subcategories whenever category changes
  useEffect(() => {
    // keep URL in sync when category changes
    const current = new URLSearchParams(searchParams as any)
    if (selectedCategory && selectedCategory !== "all") current.set("category", selectedCategory)
    else current.delete("category")
    current.delete("page")
    router.replace(`?${current.toString()}`)

    const run = async () => {
      setSelectedSubCategory("all")
      setSubCategoryOptions([])
      const cat = selectedCategory
      if (!cat || cat === "all") return
      try {
        const res = await fetch(`/api/categories?slug=${encodeURIComponent(cat)}`, { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        const list: string[] = Array.isArray(data?.category?.subcategories)
          ? data.category.subcategories.map((s: any) => s?.slug || s?.name).filter(Boolean)
          : []
        setSubCategoryOptions(list)
      } catch (_) {
        setSubCategoryOptions([])
      }
    }
    run()
  }, [selectedCategory])

  // Fetch businesses for city + filters (page 1 replace, page > 1 append)
  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        if (page === 1) setLoading(true)
        else setLoadingMore(true)
        setError("")
        const params = new URLSearchParams()
        params.set("city", cityName)
        if (selectedCategory !== "all") params.set("category", selectedCategory)
        if (selectedSubCategory !== "all") params.set("subcategory", selectedSubCategory)
        params.set("page", String(page))
        params.set("limit", String(limit))
        const res = await fetch(`/api/business?${params.toString()}`, { cache: "no-store", signal: controller.signal })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.ok === false) throw new Error(data?.error || `Failed (${res.status})`)
        const list: ListBusiness[] = Array.isArray(data?.businesses) ? data.businesses : []
        const pagination = data?.pagination || {}
        const t = pagination.total ?? list.length
        const p = pagination.pages ?? (Math.ceil(t / limit) || 1)
        setBusinesses((prev) => page === 1 ? list : prev.concat(list))
        setTotalPages(p)
        setTotal(t)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e?.message || 'Failed to load')
        if (page === 1) {
          setBusinesses([])
          setTotalPages(1)
          setTotal(0)
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    }
    load()
    return () => controller.abort()
  }, [cityName, citySlug, selectedCategory, selectedSubCategory, page])

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return
    setPage((prev) => prev + 1)
  }, [loadingMore, page, totalPages])

  // Infinite scroll: load more when sentinel is in view
  useEffect(() => {
    if (loading || loadingMore || page >= totalPages || businesses.length === 0) return
    const el = loadMoreSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { root: null, rootMargin: "500px 0px", threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, loadingMore, page, totalPages, businesses.length, loadMore])


  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: cityName, url: `/city/${citySlug}` },
  ]

  return (
    <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading...</div>}>
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="min-h-screen bg-background">
        <main className="px-4 sm:px-6 py-6 sm:py-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">{cityName}</span>
          </nav>
          <div className="mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Businesses in {cityName}, Pakistan</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {loading ? "Loading..." : total > 0 ? `Showing ${businesses.length} of ${total.toLocaleString()} businesses` : `${businesses.length} businesses found`}
                {selectedCategory !== "all" && (
                  <span>
                    {" "}in {categories.find((cat) => cat.slug === selectedCategory)?.name || selectedCategory}
                  </span>
                )}
                {selectedSubCategory !== "all" && (
                  <span>{" "}› {selectedSubCategory.replace(/-/g, " ")}</span>
                )}
              </p>
            </div>

            {/* Center ad */}
            <div className="my-6">
              <AdSection slotId="city-center-ad" />
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 sm:flex-none">
                <label className="text-sm font-medium whitespace-nowrap">Category:</label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => { setSelectedCategory(v); setPage(1) }}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 sm:flex-none">
                <label className="text-sm font-medium whitespace-nowrap">Subcategory:</label>
                <Select
                  value={selectedSubCategory}
                  onValueChange={(v) => { setSelectedSubCategory(v); setPage(1) }}
                  disabled={selectedCategory === "all" || subCategoryOptions.length === 0}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="All Subcategories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcategories</SelectItem>
                    {subCategoryOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/-/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-center text-red-600 mb-6">{error}</div>
          )}

          {!loading && businesses.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">Searching businesses…</h3>
              <p className="text-muted-foreground mb-4">Hold on, we’re bringing businesses for you…</p>
            </div>
          )}

          {(() => {
            const pairs: typeof businesses[] = []
            for (let i = 0; i < businesses.length; i += 2) {
              pairs.push(businesses.slice(i, i + 2))
            }
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {pairs.map((pair, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && idx % 2 === 0 && (
                        <div className="md:col-span-2">
                          <AdSection slotId="city-inline-ad" className="my-6" />
                        </div>
                      )}
                      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {pair.map((business) => (
                            <ListingCard key={business.id} business={business} variant="card" />
                          ))}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {/* Infinite scroll sentinel + Load more button */}
                {page < totalPages && businesses.length > 0 && (
                  <div ref={loadMoreSentinelRef} className="min-h-[120px] flex flex-col items-center justify-center py-8 gap-4">
                    {loadingMore ? (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                        <span>Loading more businesses...</span>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" onClick={loadMore}>
                        Load more businesses
                      </Button>
                    )}
                  </div>
                )}
              </>
            )
          })()}
        </main>
      </div>
    </Suspense>
  )
}
