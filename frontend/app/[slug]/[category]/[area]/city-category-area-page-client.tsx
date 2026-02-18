"use client"

import Link from "next/link"
import { ListingCard } from "@/components/listing-card"
import { BreadcrumbSchema } from "@/components/breadcrumb-schema"
import { getBusinessLogoUrl } from "@/lib/utils"
import type { ListingBusiness } from "@/lib/types"

export function CityCategoryAreaPageClient({
  citySlug,
  cityName,
  categorySlug,
  categoryName,
  areaSlug,
  areaName,
  initialBusinesses,
}: {
  citySlug: string
  cityName: string
  categorySlug: string
  categoryName: string
  areaSlug: string
  areaName: string
  initialBusinesses: any[]
}) {
  const businesses: ListingBusiness[] = initialBusinesses.map((b: any) => ({
    id: b._id?.toString?.() || b.id || "",
    slug: b.slug,
    name: b.name,
    category: b.category,
    city: b.city,
    address: b.address,
    description: b.description,
    logoUrl: b.logoUrl || getBusinessLogoUrl(b.logoPublicId),
    phone: b.phone,
    email: b.email,
    status: b.status,
  }))

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: cityName, url: `/city/${citySlug}` },
    { name: `${categoryName} in ${cityName}`, url: `/${citySlug}/${categorySlug}` },
    { name: areaName, url: `/${citySlug}/${categorySlug}/${areaSlug}` },
  ]

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span aria-hidden>/</span>
            <Link href={`/city/${citySlug}`} className="hover:text-primary">{cityName}</Link>
            <span aria-hidden>/</span>
            <Link href={`/${citySlug}/${categorySlug}`} className="hover:text-primary">{categoryName}</Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">{areaName}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {categoryName} in {areaName}, {cityName}
          </h1>
          <p className="text-muted-foreground mb-6">
            {businesses.length} {businesses.length === 1 ? "business" : "businesses"} found
          </p>
          {businesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {businesses.map((business) => (
                <ListingCard key={business.id} business={business} variant="card" />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No businesses listed yet in this area.</p>
          )}
        </main>
      </div>
    </>
  )
}
