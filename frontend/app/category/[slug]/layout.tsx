import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getBackendUrl } from "@/lib/api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prettyName = slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  let categoryName = prettyName;

  try {
    const res = await fetch(`${getBackendUrl()}/api/categories?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data?.category?.name) categoryName = data.category.name;
    }
  } catch {
    // use prettyName
  }

  const title = `${categoryName} – Businesses in Pakistan | ${SITE_NAME}`;
  const description = `Find ${categoryName} businesses across Pakistan. Browse listings, read reviews, and get contact details. Free business directory.`;
  const canonicalUrl = `${SITE_URL}/category/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${categoryName} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: { card: "summary", title: `${categoryName} | ${SITE_NAME}` },
  };
}

export default function CategorySlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
