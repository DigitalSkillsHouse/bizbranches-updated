import { getBuildSlugs } from "@/lib/build-slugs"
import CityPageClient from "./city-page-client"

export async function generateStaticParams() {
  try {
    const { cities } = await getBuildSlugs();
    return cities.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export default function CityPage() {
  return <CityPageClient />;
}
