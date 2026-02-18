import { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { CategoryPageClient } from "./category-page-client"

function prettySlug(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const { slug } = await params
  const q = await searchParams
  const subcategory = typeof q?.subcategory === "string" ? q.subcategory : null

  let categoryName = prettySlug(slug)
  try {
    const res = await fetch(`${getBackendUrl()}/api/categories?slug=${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      if (data?.category?.name) categoryName = data.category.name
    }
  } catch {
    // use prettySlug
  }

  if (subcategory) {
    const subName = typeof subcategory === "string" ? subcategory.replace(/-/g, " ") : subcategory
    const titleSub = subName.charAt(0).toUpperCase() + subName.slice(1)
    const canonicalUrl = `${SITE_URL}/category/${slug}?subcategory=${encodeURIComponent(subcategory)}`
    const title = `${titleSub} in Pakistan | ${SITE_NAME}`
    const description = `Find ${titleSub.toLowerCase()} businesses across Pakistan. Browse listings, read reviews, and get contact details. Free business directory.`
    return {
      title,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: { title: `${titleSub} | ${SITE_NAME}`, description, url: canonicalUrl, type: "website" },
      twitter: { card: "summary", title: `${titleSub} | ${SITE_NAME}` },
    }
  }

  const canonicalUrl = `${SITE_URL}/category/${slug}`
  const title = `${categoryName} – Businesses in Pakistan | ${SITE_NAME}`
  const description = `Find ${categoryName} businesses across Pakistan. Browse listings, read reviews, and get contact details. Free business directory.`
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title: `${categoryName} | ${SITE_NAME}`, description, url: canonicalUrl, type: "website" },
    twitter: { card: "summary", title: `${categoryName} | ${SITE_NAME}` },
  }
}

export default function CategoryPage() {
  return <CategoryPageClient />
}
