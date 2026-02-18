import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cityName = slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  const title = `Businesses in ${cityName}, Pakistan – ${SITE_NAME}`;
  const description = `Find local businesses in ${cityName}. Browse by category, read reviews, and get contact details. Pakistan free business listing directory.`;
  const canonicalUrl = `${SITE_URL}/city/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `Businesses in ${cityName} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: { card: "summary", title: `${cityName} Businesses | ${SITE_NAME}` },
  };
}

export default function CitySlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
