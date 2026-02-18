import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BusinessSchema } from "@/components/business-schema";
import { BreadcrumbSchema } from "@/components/breadcrumb-schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getBackendUrl } from "@/lib/api";
import { logger } from "@/lib/logger";
import BusinessDetailPage from "../business/[id]/page";

function serializeId(doc: any): any {
  if (!doc) return doc;
  if (Array.isArray(doc)) return doc.map(serializeId);
  if (typeof doc !== 'object') return doc;
  // Handle Buffer, ObjectId, or objects with toJSON
  if (typeof doc.toJSON === 'function') {
    try {
      const jsonVal = doc.toJSON();
      if (typeof jsonVal === 'object') return serializeId(jsonVal);
      return jsonVal;
    } catch {}
  }
  const out: any = {};
  for (const key in doc) {
    if (key === '_id') {
      out.id = String(doc._id);
      continue;
    }
    const val = doc[key];
    if (val && typeof val === 'object') {
      if (typeof val.toJSON === 'function') {
        try {
          const jsonVal = val.toJSON();
          out[key] = typeof jsonVal === 'object' ? serializeId(jsonVal) : jsonVal;
        } catch {
          out[key] = String(val);
        }
      } else {
        out[key] = serializeId(val);
      }
    } else {
      out[key] = val;
    }
  }
  return out;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const backendUrl = getBackendUrl();

  let business: any = null;
  
  try {
    // Fetch business data from backend
    const response = await fetch(`${backendUrl}/api/business/${encodeURIComponent(slug)}`, {
      headers: {
        ...Object.fromEntries((await headers()).entries()),
      },
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.business) {
        business = serializeId(data.business);
      }
    }
  } catch {
    // Continue with null business, will use fallbacks
  }

  const businessName = business?.name || slug;
  const categoryName = business?.category || "Business";
  const cityName = business?.city ? `${business.city}, Pakistan` : "Pakistan";
  const title = `${businessName} – ${categoryName} in ${cityName} | ${SITE_NAME}`;
  let description =
    "View contact details, reviews, and location for this business on Pakistan's free business directory.";
  if (business?.description) {
    const rawDesc = typeof business.description === "string" ? business.description : "";
    const normalized = rawDesc.replace(/\s+/g, " ").trim();
    description = normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
  }
  const canonicalUrl = `${SITE_URL}/${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${businessName} | ${SITE_NAME}`,
      description,
      type: "website",
      url: canonicalUrl,
    },
    twitter: { card: "summary_large_image", title: `${businessName} | ${SITE_NAME}`, description },
  };
}

export default async function BusinessBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const backendUrl = getBackendUrl();

  let business: any = null;
  let related: any[] = [];
  let reviews: any[] = [];
  let ratingCount = 0;
  let ratingAvg = 0;

  try {
    // Fetch business data
    const bizResponse = await fetch(`${backendUrl}/api/business/${encodeURIComponent(slug)}`, {
      headers: {
        ...Object.fromEntries((await headers()).entries()),
      },
      next: {
        revalidate: 3600, // Revalidate every hour
      },
    });

    if (!bizResponse.ok) {
      // Only log non-404 errors (404 is expected for missing businesses)
      if (bizResponse.status !== 404) {
        logger.error(`Failed to fetch business: ${bizResponse.status} - ${bizResponse.statusText}`);
      }
      // Return a page with error information instead of throwing
      return (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h1>
            <p className="text-muted-foreground">The business you're looking for doesn't exist or is currently unavailable.</p>
            {bizResponse.status !== 404 && (
              <p className="text-sm text-muted-foreground mt-4">Error: Failed to load business data ({bizResponse.status})</p>
            )}
          </div>
        </div>
      );
    }

    const bizData = await bizResponse.json();
    if (!bizData.ok || !bizData.business) {
      // Only log if it's not a simple "not found" error
      if (bizData.error && !bizData.error.toLowerCase().includes('not found')) {
        logger.error(bizData.error);
      }
      // Return a page with error information
      return (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h1>
            <p className="text-muted-foreground">The business you're looking for doesn't exist or is currently unavailable.</p>
            {bizData.error && !bizData.error.toLowerCase().includes('not found') && (
              <p className="text-sm text-muted-foreground mt-4">Error: {bizData.error}</p>
            )}
          </div>
        </div>
      );
    }
    business = serializeId(bizData.business);

    // Redirect to slug URL when user visited by id (pretty URL + SEO)
    const isObjectId = /^[a-f0-9]{24}$/i.test(slug);
    if (isObjectId && business.slug && business.slug !== slug) {
      redirect(`/${encodeURIComponent(business.slug)}`);
    }

    // Fetch related businesses (same category and city)
    if (business?.category && business?.city) {
      try {
        const relatedResponse = await fetch(
          `${backendUrl}/api/business/related?category=${encodeURIComponent(business.category)}&city=${encodeURIComponent(business.city)}&excludeSlug=${encodeURIComponent(business.slug)}`,
          {
            next: {
              revalidate: 7200, // Revalidate every 2 hours
            },
          }
        );
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          if (relatedData.ok && Array.isArray(relatedData.businesses)) {
            related = relatedData.businesses.map(serializeId);
          }
        }
      } catch (error) {
        logger.error("Error fetching related businesses:", error);
        // Continue with empty related array
      }
    }

    // Fetch reviews and aggregates
    try {
      const reviewsResponse = await fetch(`${backendUrl}/api/reviews?businessId=${encodeURIComponent(business.id || slug)}`, {
        next: {
          revalidate: 1800, // Revalidate every 30 minutes
        },
      });
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        if (reviewsData.ok) {
          reviews = reviewsData.reviews.map(serializeId);
          ratingCount = reviewsData.ratingCount || reviews.length;
          ratingAvg = reviewsData.ratingAvg || 0;
        }
      }
    } catch (error) {
      logger.error("Error fetching reviews:", error);
      // Continue with empty reviews array
    }
  } catch (error) {
    logger.error("Error in BusinessBySlugPage:", error);
    // Return a page with error information
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Service Unavailable</h1>
          <p className="text-muted-foreground">We're having trouble loading business details right now. Please try again later.</p>
          <p className="text-sm text-muted-foreground mt-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Business Not Found</h1>
          <p className="text-muted-foreground">The business you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const categorySlug = business.category ? String(business.category).toLowerCase().replace(/\s+/g, "-") : "";
  const breadcrumbs = [
    { name: "Home", url: "/" },
    ...(categorySlug ? [{ name: business.category || categorySlug, url: `/category/${categorySlug}` }] : []),
    { name: business.name, url: `/${slug}` },
  ];

  return (
    <>
      <BusinessSchema business={business} ratingAvg={ratingAvg} ratingCount={ratingCount} />
      <BreadcrumbSchema items={breadcrumbs} />
      <BusinessDetailPage
        initialBusiness={business}
        initialReviews={reviews}
        initialRatingAvg={ratingAvg}
        initialRatingCount={ratingCount}
        initialRelated={related}
      />
    </>
  );
}