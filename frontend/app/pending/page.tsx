"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/listing-card"

 type Business = {
  id: string
  _id?: string
  slug?: string
  name: string
  category: string
  city?: string
  address?: string
  description?: string
  logo?: string
  logoUrl?: string
  logoPublicId?: string
  imageUrl?: string
  phone?: string
  email?: string
  status?: "pending" | "approved" | "rejected"
}

export default function PendingSubmissionsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 12

  useEffect(() => {
    const controller = new AbortController()
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const params = new URLSearchParams()
        params.set("page", String(currentPage))
        params.set("limit", String(limit))
        params.set("status", "pending")
        const res = await fetch(`/api/business/pending?page=${currentPage}&limit=${limit}`, { cache: "no-store", signal: controller.signal })
        const data = await res.json()
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to fetch pending submissions")
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
          }
        })
        setBusinesses(items)
        setTotal(data.pagination?.total || items.length)
        setTotalPages(data.pagination?.pages || 1)
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e?.message || "Failed to load pending submissions")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    return () => controller.abort()
  }, [currentPage])

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pending Submissions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Businesses awaiting admin approval</p>
        </div>

        {isLoading && <div className="text-center text-muted-foreground py-12">Loading pending submissions...</div>}
        {error && <div className="text-center text-destructive py-8">{error}</div>}

        {!isLoading && !error && (
          businesses.length > 0 ? (
            <>
              <div className="divide-y rounded-lg border bg-card">
                {businesses.map((b) => (
                  <div key={b.id} className="p-4 md:p-5">
                    <ListingCard business={b} variant="compact" />
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground">
                    Page {currentPage} of {totalPages} • {total} result{total !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">No pending submissions</h3>
              <p className="text-muted-foreground">New businesses awaiting approval will appear here.</p>
            </div>
          )
        )}
      </main>
    </div>
  )
}
