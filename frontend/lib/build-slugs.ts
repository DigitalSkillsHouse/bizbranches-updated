/**
 * Fetches all slugs from the API at build time for static export (generateStaticParams).
 * Used when NEXT_PUBLIC_BACKEND_URL / BACKEND_URL is set (e.g. in CI).
 */
import { getBackendUrl } from "@/lib/api";

const LIMIT = 50000;

export async function getBuildSlugs(): Promise<{
  businesses: { slug: string }[];
  categories: { slug: string }[];
  cities: { slug: string }[];
  cityCategory: { slug: string; category: string }[];
  cityCategoryArea: { slug: string; category: string; area: string }[];
}> {
  const base = getBackendUrl();
  const out = {
    businesses: [] as { slug: string }[],
    categories: [] as { slug: string }[],
    cities: [] as { slug: string }[],
    cityCategory: [] as { slug: string; category: string }[],
    cityCategoryArea: [] as { slug: string; category: string; area: string }[],
  };

  try {
    // Businesses (paginated)
    let page = 1;
    let total = 0;
    do {
      const res = await fetch(`${base}/api/sitemap/businesses?page=${page}&limit=${LIMIT}`, {
        cache: "no-store",
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data?.ok && Array.isArray(data.businesses)) {
        out.businesses.push(...data.businesses.map((b: { slug: string }) => ({ slug: b.slug })));
        total = data.total ?? 0;
        if (data.businesses.length < (data.total ?? 0)) page++;
        else break;
      } else break;
    } while (out.businesses.length < total);

    // Categories
    const catRes = await fetch(`${base}/api/categories?limit=500`, { cache: "no-store" });
    if (catRes.ok) {
      const d = await catRes.json();
      if (d?.ok && Array.isArray(d.categories)) {
        out.categories = d.categories.map((c: { slug: string }) => ({ slug: c.slug }));
      }
    }

    // Cities
    const cityRes = await fetch(`${base}/api/cities?limit=500`, { cache: "no-store" });
    if (cityRes.ok) {
      const d = await cityRes.json();
      if (d?.ok && Array.isArray(d.cities)) {
        out.cities = d.cities.map((c: { slug: string }) => ({ slug: c.slug }));
      }
    }

    // Geo pages (city/category, city/category/area)
    const geoRes = await fetch(`${base}/api/sitemap/geo-pages`, { cache: "no-store" });
    if (geoRes.ok) {
      const d = await geoRes.json();
      if (d?.ok) {
        const cc = (d.cityCategory as string[]) ?? [];
        out.cityCategory = cc.map((path) => {
          const [slug, category] = path.split("/");
          return { slug, category: category ?? "" };
        });
        const cca = (d.cityCategoryArea as string[]) ?? [];
        out.cityCategoryArea = cca.map((path) => {
          const parts = path.split("/");
          const area = (parts[2] ?? "").replace(/\s+/g, "-").toLowerCase();
          return {
            slug: parts[0] ?? "",
            category: parts[1] ?? "",
            area: area || (parts[2] ?? ""),
          };
        });
      }
    }
  } catch {
    // API unreachable at build time; return empty so we still get static pages for fixed routes
  }

  return out;
}
