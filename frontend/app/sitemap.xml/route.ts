import { NextResponse } from "next/server";
import { getBaseUrl, sitemapEntry } from "@/lib/sitemap";
import { getBackendUrl } from "@/lib/api";

const SITEMAP_BUSINESS_LIMIT = 45000;

export const dynamic = 'force-static';
export const revalidate = 300;

/**
 * GET /sitemap.xml — Sitemap index referencing pages sitemap and paginated business sitemaps.
 * Stays within Google limits by splitting business URLs across sitemap-1, sitemap-2, etc.
 */
export async function GET() {
  try {
    const base = getBaseUrl();
    const now = new Date();
    const entries: string[] = [];

    entries.push(sitemapEntry(`${base}/sitemap/pages.xml`, now));

    const countRes = await fetch(
      `${getBackendUrl()}/api/sitemap/businesses?page=1&limit=1`,
      { next: { revalidate: 300 } }
    );
    if (countRes.ok) {
      const data = await countRes.json();
      const total = data.total ?? 0;
      if (total > 0) {
        const pages = Math.ceil(total / SITEMAP_BUSINESS_LIMIT);
        for (let p = 1; p <= pages; p++) {
          entries.push(sitemapEntry(`${base}/sitemap/businesses/${p}`, now));
        }
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (e) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${getBaseUrl()}/sitemap/pages.xml</loc></sitemap>
</sitemapindex>`;
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "no-store",
      },
    });
  }
}
