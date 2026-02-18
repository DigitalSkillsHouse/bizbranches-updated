import { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { citySlugToName } from "@/lib/city-slug"
import { getBackendUrl } from "@/lib/api"
import { CityCategoryPageClient } from "./city-category-page-client"

export function generateStaticParams() {
  return [{ slug: '_placeholder', category: '_placeholder' }];
}

function categorySlugToTitle(slug: string): string {
  return slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; category: string }>
}): Promise<Metadata> {
  const { slug: citySlug, category } = await params
  const cityName = citySlugToName(citySlug)
  const categoryName = categorySlugToTitle(category)
  const title = `${categoryName} in ${cityName}, Pakistan | ${SITE_NAME}`
  const description = `Find ${categoryName} businesses in ${cityName}, Pakistan. Contact details, reviews, and directions.`
  const canonicalUrl = `${SITE_URL}/${citySlug}/${category}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${categoryName} in ${cityName} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      type: "website",
      locale: "en_PK",
    },
    twitter: { card: "summary_large_image", title: `${categoryName} in ${cityName} | ${SITE_NAME}` },
    robots: { index: true, follow: true },
  }
}

export default async function CityCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; category: string }>
}) {
  const { slug: citySlug, category } = await params
  const cityName = citySlugToName(citySlug)
  const limit = 24
  let businesses: any[] = []
  try {
    const res = await fetch(
      `${getBackendUrl()}/api/business?city=${encodeURIComponent(cityName)}&category=${encodeURIComponent(category)}&limit=${limit}&page=1`,
      { next: { revalidate: 300 } }
    )
    const data = await res.json().catch(() => ({}))
    if (data?.ok && Array.isArray(data.businesses)) businesses = data.businesses
  } catch {
    // use empty
  }

  const categoryName = categorySlugToTitle(category)
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoryName} in ${cityName}`,
    description: `List of ${categoryName} in ${cityName}, Pakistan`,
    numberOfItems: businesses.length,
    itemListElement: businesses.slice(0, 20).map((b: any, i: number) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: b.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: b.address,
          addressLocality: b.city,
          addressRegion: b.province,
          addressCountry: "PK",
        },
        url: b.slug ? `${SITE_URL}/${b.slug}` : undefined,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <CityCategoryPageClient
        citySlug={citySlug}
        cityName={cityName}
        categorySlug={category}
        categoryName={categoryName}
        initialBusinesses={businesses}
      />
    </>
  )
}
