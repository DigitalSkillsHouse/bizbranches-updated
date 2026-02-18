import { SITE_URL } from "@/lib/site";

interface BusinessSchemaProps {
  business: any;
  /** Optional: average rating 1–5 for aggregateRating schema */
  ratingAvg?: number;
  /** Optional: total review count for aggregateRating schema */
  ratingCount?: number;
}

export function BusinessSchema({ business, ratingAvg = 0, ratingCount = 0 }: BusinessSchemaProps) {
  if (!business) return null;

  const slugOrId = business.slug || business.id || business._id || "";
  const canonicalUrl = `${SITE_URL}/${encodeURIComponent(String(slugOrId))}`;
  const sameAs = [business.facebookUrl, business.youtubeUrl, business.gmbUrl, business.websiteUrl].filter(
    (v: unknown) => typeof v === "string" && v.trim().length > 0
  );
  const description =
    typeof business.description === "string" && business.description.trim()
      ? business.description
      : `${business.name} is a ${business.category || "business"} in ${business.city || "Pakistan"}. Contact via phone, email, or visit.`;

  const schemaData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": canonicalUrl,
    name: business.name,
    image: business.logoUrl || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address || undefined,
      addressLocality: business.city || undefined,
      addressRegion: business.province || undefined,
      postalCode: business.postalCode || undefined,
      addressCountry: "PK",
    },
    telephone: business.phone || undefined,
    email: business.email || undefined,
    url: canonicalUrl,
    priceRange: "PKR",
    description,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    areaServed: { "@type": "Country", name: "Pakistan" },
  };

  if (business.openingHours && Array.isArray(business.openingHours) && business.openingHours.length > 0) {
    schemaData.openingHoursSpecification = business.openingHours.map((h: { day?: string; open?: string; close?: string }) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.day || undefined,
      opens: h.open || undefined,
      closes: h.close || undefined,
    }));
  } else if (typeof business.openingHours === "string" && business.openingHours.trim()) {
    schemaData.openingHours = business.openingHours;
  }

  if (business.latitude && business.longitude) {
    schemaData.geo = {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude,
    };
  }

  if (ratingCount > 0 && ratingAvg >= 0 && ratingAvg <= 5) {
    schemaData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(Number(ratingAvg).toFixed(1)),
      bestRating: "5",
      worstRating: "1",
      ratingCount: String(ratingCount),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
