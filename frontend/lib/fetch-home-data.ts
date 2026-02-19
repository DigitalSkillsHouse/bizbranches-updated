import { getBackendUrl } from "@/lib/api";

export async function fetchHomePageData() {
  let categories: any[] = [];
  let recent: any[] = [];
  const base = getBackendUrl();

  try {
    const [categoriesRes, recentRes] = await Promise.all([
      fetch(`${base}/api/categories?limit=24`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }),
      fetch(`${base}/api/business/recent?limit=12`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    if (categoriesRes.ok) {
      try {
        const data = await categoriesRes.json();
        if (data?.ok && Array.isArray(data.categories)) {
          categories = data.categories;
        }
      } catch {
        // ignore
      }
    }

    if (recentRes.ok) {
      try {
        const data = await recentRes.json();
        if (data?.ok && Array.isArray(data.businesses)) {
          recent = data.businesses;
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // Backend unreachable (e.g. during build). Return empty data so prerender succeeds.
  }

  return { categories, recent };
}
