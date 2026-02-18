"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Layers } from "lucide-react"

type Subcategory = { name: string; slug: string }
type Category = {
  name: string
  slug: string
  count?: number
  icon?: string
  imageUrl?: string | null
  subcategories?: Subcategory[]
}

const fallbackIcons: Record<string, string> = {
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

function mapCategory(c: any): Category {
  return {
    name: c.name || c.slug,
    slug: c.slug,
    count: typeof c.count === "number" ? c.count : undefined,
    icon: c.icon || fallbackIcons[c.slug] || "📦",
    imageUrl: c.imageUrl || null,
    subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
  }
}

export function CategoryIndexClient({ initialCategories = [] }: { initialCategories?: any[] }) {
  const [categories, setCategories] = useState<Category[]>(
    (initialCategories || []).map(mapCategory)
  )
  const [loading, setLoading] = useState(initialCategories.length === 0)

  useEffect(() => {
    if (initialCategories.length > 0) return
    let alive = true
    ;(async () => {
      try {
        const res = await fetch("/api/categories?limit=200&nocache=1", { cache: "no-store" })
        const data = await res.json().catch(() => ({}))
        if (alive && data?.ok && Array.isArray(data.categories)) {
          setCategories(data.categories.map(mapCategory))
        }
      } catch {
        // keep initial
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [initialCategories.length])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 to-white">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide mb-4">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            Browse by industry
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Business Categories in Pakistan
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Explore all business categories and subcategories. Find local businesses by industry—restaurants, healthcare, education, retail, and more across Pakistan.
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 animate-pulse">
                <div className="h-12 w-12 rounded-lg bg-gray-200 mb-4" />
                <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <article
                key={cat.slug}
                className="rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-primary/20 transition-all overflow-hidden"
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className="block p-5 sm:p-6 group"
                  aria-label={`Browse ${cat.name} businesses in Pakistan`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-2xl sm:text-3xl">
                      {cat.icon || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                        {cat.name}
                      </h2>
                      {typeof cat.count === "number" && (
                        <p className="text-sm text-gray-500 mb-2">
                          {cat.count} listing{cat.count !== 1 ? "s" : ""}
                        </p>
                      )}
                      {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {cat.subcategories.slice(0, 4).map((sub) => (
                            <span
                              key={sub.slug}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600"
                            >
                              {sub.name}
                            </span>
                          ))}
                          {cat.subcategories.length > 4 && (
                            <span className="text-xs text-gray-400">+{cat.subcategories.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary flex-shrink-0 mt-1" />
                  </div>
                </Link>
                {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                  <div className="border-t border-gray-100 px-5 sm:px-6 py-3 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Subcategories</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/category/${cat.slug}?subcategory=${encodeURIComponent(sub.name)}`}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No categories available at the moment. Check back later.</p>
            <Link href="/" className="text-primary font-medium hover:underline mt-2 inline-block">
              Back to home
            </Link>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-600 max-w-2xl mx-auto">
          <p>
            BizBranches lists businesses across Pakistan by category and city. Use the links above to browse{" "}
            <strong>business categories in Pakistan</strong> and their subcategories, or{" "}
            <Link href="/search" className="text-primary font-medium hover:underline">search all businesses</Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
