import { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { citySlugToName } from "@/lib/city-slug"
import { getBackendUrl } from "@/lib/api"
import { CityCategoryAreaPageClient } from "./city-category-area-page-client"

export function generateStaticParams() {
  return [{ slug: '_placeholder', category: '_placeholder', area: '_placeholder' }];
}

function slugToTitle(slug: string): string {
  return slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; category: string; area: string }>
}): Promise<Metadata> {
  const { slug: citySlug, category, area } = await params
  const cityName = citySlugToName(citySlug)
  const categoryName = slugToTitle(category)
  const areaName = slugToTitle(area)
  const title = `${categoryName} in ${areaName}, ${cityName} | ${SITE_NAME}`
  const description = `Find ${categoryName} in ${areaName}, ${cityName}, Pakistan. Contact details and directions.`
  const canonicalUrl = `${SITE_URL}/${citySlug}/${category}/${area}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${categoryName} in ${areaName}, ${cityName} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      type: "website",
      locale: "en_PK",
    },
    twitter: { card: "summary_large_image", title: `${categoryName} in ${areaName} | ${SITE_NAME}` },
    robots: { index: true, follow: true },
  }
}

export default async function CityCategoryAreaPage({
  params,
}: {
  params: Promise<{ slug: string; category: string; area: string }>
}) {
  const { slug: citySlug, category, area } = await params
  const cityName = citySlugToName(citySlug)
  const limit = 24
  let businesses: any[] = []
  try {
    const q = new URLSearchParams({
      city: cityName,
      category,
      area: slugToTitle(area),
      limit: String(limit),
      page: "1",
    })
    const res = await fetch(`${getBackendUrl()}/api/business?${q.toString()}`, { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    if (data?.ok && Array.isArray(data.businesses)) businesses = data.businesses
  } catch {
    // use empty
  }

  const categoryName = slugToTitle(category)
  const areaName = slugToTitle(area)
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoryName} in ${areaName}, ${cityName}`,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <CityCategoryAreaPageClient
        citySlug={citySlug}
        cityName={cityName}
        categorySlug={category}
        categoryName={categoryName}
        areaSlug={area}
        areaName={areaName}
        initialBusinesses={businesses}
      />
    </>
  )
}
