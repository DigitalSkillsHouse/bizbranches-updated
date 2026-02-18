import { getBackendUrl } from "@/lib/api";

export async function fetchCategoriesForIndex() {
  try {
    const res = await fetch(`${getBackendUrl()}/api/categories?limit=200&nocache=1`, {
      next: { revalidate: 600 },
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.categories) ? data.categories : [];
  } catch {
    return [];
  }
}
