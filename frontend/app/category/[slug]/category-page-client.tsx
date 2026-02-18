"use client"
import React from "react"
import { ListingCard } from "@/components/listing-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cities } from "@/lib/mock-data"
import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import FancyLoader from "@/components/fancy-loader"
import { Building2 } from "lucide-react"
import Link from "next/link"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { AdSenseSlot } from "@/components/adsense-slot"
import { slugify } from "@/lib/utils"
import { logger } from "@/lib/logger"

const AD_EVERY_N_CARDS = 4

type Subcategory = { name: string; slug: string }

export function CategoryPageClient() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const categorySlug = params.slug as string
  const subcategoryParam = searchParams.get("subcategory")

  const [categoryInfo, setCategoryInfo] = useState<any>(null)
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(() => {
    const p = subcategoryParam?.trim()
    return p && p.toLowerCase() !== "all" ? p : "all"
  })

  useEffect(() => {
    const p = searchParams.get("subcategory")?.trim()
    setSelectedSubcategory(p && p.toLowerCase() !== "all" ? p : "all")
  }, [searchParams])
  const [businesses, setBusinesses] = useState<any[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([])
  const [selectedCity, setSelectedCity] = useState("all")
  const [loading, setLoading] = useState(true)
  const [apiPage, setApiPage] = useState(() => {
    const p = searchParams.get("page")
    const n = p ? parseInt(p, 10) : 1
    return n >= 1 ? n : 1
  })
  const [apiTotalPages, setApiTotalPages] = useState(1)
  const [apiTotal, setApiTotal] = useState(0)
  const PAGE_SIZE = 12
  const POPULAR_CITIES = cities.slice(0, 10)

  const prettyName = categorySlug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")

  useEffect(() => {
    let active = true
    const fetchCategoryData = async () => {
      try {
        setLoading(true)
        const catRes = await fetch(`/api/categories?slug=${categorySlug}`)
        if (catRes.ok) {
          const catData = await catRes.json()
          if (catData?.category) {
            if (active) {
              setCategoryInfo(catData.category)
              const subCats = catData.category.subcategories || []
              setSubcategories(
                subCats.map((s: any) => ({
                  name: s.name || s.slug,
                  slug: s.slug || (s.name ? slugify(s.name) : ""),
                }))
              )
            }
          }
        }
      } catch (error) {
        logger.error("Error fetching category:", error)
      } finally {
        if (active) setLoading(false)
      }
    }
    if (categorySlug) fetchCategoryData()
    return () => {
      active = false
    }
  }, [categorySlug])

  useEffect(() => {
    if (!categorySlug) return
    let active = true
    const fetchBusinesses = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set("category", categorySlug)
        params.set("page", String(apiPage))
        params.set("limit", String(PAGE_SIZE))
        if (selectedSubcategory && selectedSubcategory !== "all") {
          const subSlug =
            subcategories.find(
              (s) =>
                s.name === selectedSubcategory ||
                s.slug === selectedSubcategory ||
                s.slug === slugify(selectedSubcategory)
            )?.slug || selectedSubcategory
          params.set("subCategory", subSlug)
        }
        const bizRes = await fetch(`/api/business?${params.toString()}`)
        if (!bizRes.ok) throw new Error("Failed to fetch businesses")
        const bizData = await bizRes.json()
        if (!active) return
        const pagination = bizData?.pagination || {}
        const total = pagination.total ?? 0
        const pages = (pagination.pages ?? Math.ceil(total / PAGE_SIZE)) || 1
        setBusinesses(bizData.businesses || [])
        setApiTotalPages(pages)
        setApiTotal(total)
      } catch (error) {
        logger.error("Error fetching businesses:", error)
        if (active) setBusinesses([])
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchBusinesses()
    return () => {
      active = false
    }
  }, [categorySlug, selectedSubcategory, apiPage, subcategories])

  useEffect(() => {
    let filtered = businesses
    if (selectedCity !== "all") {
      filtered = businesses.filter(
        (business) =>
          business.city && business.city.toLowerCase() === selectedCity.toLowerCase()
      )
    }
    setFilteredBusinesses(filtered)
  }, [businesses, selectedCity])

  const goToPage = (pageNum: number) => {
    if (pageNum < 1 || pageNum > apiTotalPages || loading) return
    setApiPage(pageNum)
    const q = new URLSearchParams()
    if (selectedSubcategory && selectedSubcategory !== "all")
      q.set("subcategory", selectedSubcategory)
    q.set("page", String(pageNum))
    router.push(`/category/${categorySlug}?${q.toString()}`)
  }

  const handleSubcategoryFilter = (value: string) => {
    setSelectedSubcategory(value)
    setApiPage(1)
    const q = new URLSearchParams()
    if (value && value !== "all") q.set("subcategory", value)
    router.push(`/category/${categorySlug}?${q.toString()}`)
  }

  const categoryName = categoryInfo?.name || prettyName
  const categoryIcon = categoryInfo?.icon || "📦"
  const subcategoryLabel =
    selectedSubcategory && selectedSubcategory !== "all"
      ? subcategories.find(
          (s) =>
            s.slug === selectedSubcategory ||
            s.name === selectedSubcategory ||
            slugify(s.name) === selectedSubcategory
        )?.name || selectedSubcategory
      : null

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: categoryName, url: `/category/${categorySlug}` },
    ...(subcategoryLabel
      ? [
          {
            name: subcategoryLabel,
            url: `/category/${categorySlug}?subcategory=${encodeURIComponent(selectedSubcategory)}`,
          },
        ]
      : []),
  ]

  const showCount =
    selectedSubcategory && selectedSubcategory !== "all"
      ? filteredBusinesses.length
      : apiTotal
  const countLabel =
    selectedCity !== "all"
      ? `${filteredBusinesses.length} in ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}`
      : `${showCount.toLocaleString()} businesses`

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/30 to-white">
      <BreadcrumbSchema items={breadcrumbItems} />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <nav
            className="flex items-center gap-2 text-sm text-gray-600 mb-4"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href={`/category/${categorySlug}`} className="hover:text-primary">
              {categoryName}
            </Link>
            {subcategoryLabel && (
              <>
                <span aria-hidden>/</span>
                <span className="font-medium text-gray-900">{subcategoryLabel}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl sm:text-3xl md:text-4xl" aria-hidden>
                {categoryIcon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-1 sm:mb-2 break-words">
                {subcategoryLabel
                  ? `${subcategoryLabel} in Pakistan`
                  : `${categoryName} Businesses in Pakistan`}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">{countLabel}</p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-3xl">
            Find {categoryName.toLowerCase()} businesses across Pakistan. Filter by subcategory
            below or by city. All listings are free—add yours today.
          </p>

          {/* Subcategory filter at top */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Subcategory</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSubcategoryFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubcategory === "all" || !selectedSubcategory
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                All
              </button>
              {subcategories.map((subcat) => {
                const isActive =
                  selectedSubcategory === subcat.name ||
                  selectedSubcategory === subcat.slug ||
                  slugify(selectedSubcategory) === subcat.slug
                return (
                  <button
                    key={subcat.slug}
                    type="button"
                    onClick={() => handleSubcategoryFilter(subcat.name)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-white shadow-md"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {subcat.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* City filter */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter by City:
            </label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.slug} value={city.slug}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Browse by city links */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Browse by City</h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CITIES.map((city) => (
                <Link
                  key={city.slug}
                  href={`/city/${city.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-primary/10 text-gray-700 hover:text-primary text-sm font-medium transition-colors"
                >
                  {categoryName} in {city.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <FancyLoader />
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {filteredBusinesses.map((business, index) => (
                <React.Fragment key={business.id || business._id || index}>
                  {index > 0 && index % AD_EVERY_N_CARDS === 0 && (
                    <div className="col-span-full py-2" role="complementary" aria-label="Advertisement">
                      <AdSenseSlot
                        slotId={`category-inline-ad-${Math.floor(index / AD_EVERY_N_CARDS)}`}
                        className="my-4"
                      />
                    </div>
                  )}
                  <ListingCard business={business} variant="card" />
                </React.Fragment>
              ))}
            </div>

            {apiTotalPages > 1 && (
              <nav
                className="flex flex-wrap items-center justify-center gap-2 py-6"
                aria-label="Pagination"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(apiPage - 1)}
                  disabled={apiPage <= 1 || loading}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  Page {apiPage} of {apiTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(apiPage + 1)}
                  disabled={apiPage >= apiTotalPages || loading}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-600 mb-4">
              {selectedSubcategory && selectedSubcategory !== "all"
                ? `No businesses in "${selectedSubcategory}" yet. Try "All" to see the full category.`
                : `No businesses in ${categoryName} yet. Be the first to list.`}
            </p>
            <Link href="/add">
              <Button>Add your business</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
