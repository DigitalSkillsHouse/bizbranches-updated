import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getBuildSlugs } from "@/lib/build-slugs";
import BusinessDetailPage from "../business/[id]/page";

const RESERVED_SLUGS = new Set(["search", "add", "category", "city", "about", "contact", "admin", "api", "pending", "sitemap", "_next", "static"]);

export async function generateStaticParams() {
  const params: { slug: string }[] = [{ slug: "_placeholder" }];
  try {
    const { businesses } = await getBuildSlugs();
    const list = (businesses || []).filter((b) => b?.slug && !RESERVED_SLUGS.has(String(b.slug).toLowerCase()));
    params.push(...list);
  } catch (_) {
    // API unreachable at build time — _placeholder still gets generated
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = `Business Details | ${SITE_NAME}`;
  const description = "View contact details, reviews, and location for this business on Pakistan's free business directory.";
  const canonicalUrl = `${SITE_URL}/${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, type: "website", url: canonicalUrl },
    twitter: { card: "summary_large_image" as const, title, description },
  };
}

export default function BusinessBySlugPage() {
  return <BusinessDetailPage />;
}