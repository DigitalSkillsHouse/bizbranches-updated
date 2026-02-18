"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Grid3x3, Layers } from "lucide-react"

type Category = { name: string; slug: string; count?: number; icon?: string; image?: string }

function mapApiToCategory(c: any): Category {
  return {
    name: c.name || c.slug,
    slug: c.slug,
    count: typeof c.count === "number" ? c.count : undefined,
    image: c.imageUrl || categoryImages[c.slug],
    icon: c.icon || fallbackIcon[c.slug] || "📦",
  }
}

const categoryImages: Record<string, string> = {
  restaurants: "/pakistani-restaurant-interior.webp",
  healthcare: "/modern-hospital.webp",
  education: "/school-building-with-playground.webp",
  automotive: "/car-repair-garage.webp",
  retail: "/placeholder.svg",
  "beauty-spa": "/placeholder.svg",
  "real-estate": "/placeholder.svg",
  technology: "/placeholder.svg",
  legal: "/placeholder.svg",
  construction: "/placeholder.svg",
  travel: "/placeholder.svg",
  finance: "/placeholder.svg",
}

const fallbackIcon: Record<string, string> = {
  restaurants: "🍽️",
  healthcare: "🏥",
  education: "🎓",
  automotive: "🚗",
  retail: "🛍️",
  "beauty-spa": "💄",
  "real-estate": "🏠",
  technology: "💻",
  legal: "⚖️",
  construction: "🏗️",
  travel: "✈️",
  finance: "💰",
}

export function CategoriesSection({ initialCategories = [] }: { initialCategories?: any[] }) {
  const initialMapped = useMemo(
    () => (Array.isArray(initialCategories) ? initialCategories.map(mapApiToCategory) : []),
    [initialCategories]
  )
  const hasInitial = initialMapped.length > 0
  const [showAll, setShowAll] = useState(false)
  const [categories, setCategories] = useState<Category[]>(initialMapped)
  const [loading, setLoading] = useState(!hasInitial)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setError(null)
        const now = Date.now()
        let cached: any[] | null = null
        try {
          const raw = sessionStorage.getItem("categories_initial")
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.data && Array.isArray(parsed.data) && (now - (parsed.ts || 0)) < CACHE_TTL_MS) {
              cached = parsed.data
            }
          }
        } catch {}

        if (cached && active && !hasInitial) {
          setCategories(cached.map((c: any) => mapApiToCategory(c)))
        }

        const fres = await fetch(`/api/categories?limit=24`)
        const fdata = await fres.json().catch(() => ({}))
        if (active && fdata?.ok && Array.isArray(fdata.categories) && fdata.categories.length > 0) {
          setCategories(fdata.categories.map((c: any) => mapApiToCategory(c)))
          try {
            sessionStorage.setItem("categories_initial", JSON.stringify({ ts: now, data: fdata.categories }))
          } catch {}
        }
        if (active) setLoading(false)
      } catch (e: any) {
        if (active) {
          setError(e?.message || "Failed to load categories")
          if (!hasInitial) setCategories([])
          setLoading(false)
        }
      }
    })()
    return () => { active = false }
  }, [reloadKey, hasInitial])

  // When user expands, lazily fetch more categories once
  useEffect(() => {
    let active = true
    if (showAll && categories.length < 20 && !loading) {
      ;(async () => {
        try {
          setLoadingMore(true)
          const now = Date.now()
          // Always fetch fresh when expanding to ensure latest from admin panel
          const res = await fetch(`/api/categories?limit=200&nocache=1`, { cache: "no-store" })
          const data = await res.json()
          try {
            if (data?.ok && Array.isArray(data.categories)) {
              sessionStorage.setItem("categories_all", JSON.stringify({ ts: now, data: data.categories }))
            }
          } catch {}
          if (active && data?.ok && Array.isArray(data.categories)) {
            setCategories(data.categories.map((c: any) => mapApiToCategory(c)))
          }
        } catch {
          // ignore errors for the lazy load
        } finally {
          setLoadingMore(false)
        }
      })()
    }
    return () => {
      active = false
    }
  }, [showAll, loading, categories.length])

  const visibleCategories = (showAll ? categories : categories.slice(0, 7))

  return (
    <section id="categories-section" className="pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-6xl relative z-10">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            Categories
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            Browse by Category
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Find businesses across Pakistan by category. Pick one to see subcategories and listings.
          </p>
          {!loading && categories.length === 0 && (
            <div className="mt-8">
              <p className="text-muted-foreground text-sm mb-4">{error ? "Failed to load categories." : "No categories available."}</p>
              <Button variant="outline" onClick={() => { setLoading(true); setReloadKey((k) => k + 1) }}>Retry</Button>
            </div>
          )}
        </div>

        {/* Category cards – modern grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {(loading ? Array.from({ length: 8 }) : visibleCategories).map((category: any, idx: number) =>
            loading ? (
              <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="h-32 sm:h-36 bg-muted animate-pulse" />
                <div className="p-4 sm:p-5">
                  <div className="h-5 w-28 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ) : (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                prefetch
                className="group block h-full rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Browse ${category.name} businesses`}
              >
                {/* Card image / icon area */}
                <div className="relative h-32 sm:h-36 bg-muted/50 overflow-hidden">
                  {category.image && category.image !== "/placeholder.svg" ? (
                    <Image
                      src={category.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                      <span className="text-5xl sm:text-6xl opacity-90 group-hover:scale-110 transition-transform duration-200" aria-hidden>
                        {category.icon || "📦"}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  {typeof category.count === "number" && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm">
                      {category.count} listings
                    </span>
                  )}
                </div>
                {/* Card body */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg truncate group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                      View businesses
                    </p>
                  </div>
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200" aria-hidden>
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            )
          )}

          {/* View all card (when collapsed) */}
          {!loading && !showAll && categories.length > 7 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="group flex flex-col items-center justify-center min-h-[200px] sm:min-h-[220px] rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-center p-6"
              aria-label="View all categories"
            >
              <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200" aria-hidden>
                <Grid3x3 className="h-6 w-6" />
              </span>
              <span className="font-semibold text-foreground text-base">View all</span>
              <span className="text-muted-foreground text-xs mt-0.5">{categories.length - 7} more</span>
            </button>
          )}
        </div>

        {!loading && showAll && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="rounded-lg" onClick={() => setShowAll(false)}>
              {loadingMore ? "Loading…" : "Show less"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
