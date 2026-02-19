import { SITE_NAME, SITE_URL } from "@/lib/site";
import BusinessDetailPage from "../business/[id]/page";

export function generateStaticParams() {
  return [{ slug: '_placeholder' }];
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