import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getBackendUrl } from "@/lib/api";

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let business: { name?: string; description?: string; category?: string } | null = null;

  try {
    const res = await fetch(`${getBackendUrl()}/api/business/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && data?.business) business = data.business;
    }
  } catch {
    // use fallbacks
  }

  const cityPart = business?.city ? ` in ${business.city}, Pakistan` : " in Pakistan";
  const title = business?.name
    ? `${business.name} – ${business.category || "Business"}${cityPart} | ${SITE_NAME}`
    : `Business | ${SITE_NAME}`;
  let description =
    "View business details, contact info, reviews and location on Pakistan's free business directory.";
  if (business?.description) {
    const d = String(business.description).replace(/\s+/g, " ").trim();
    description = d.length > 160 ? `${d.slice(0, 157)}...` : d;
  }
  const canonicalUrl = `${SITE_URL}/business/${encodeURIComponent(id)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${business?.name || "Business"} | ${SITE_NAME}`,
      description,
      type: "website",
      url: canonicalUrl,
    },
    twitter: { card: "summary_large_image", title: `${business?.name || "Business"} | ${SITE_NAME}`, description },
  };
}

export default function BusinessIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
