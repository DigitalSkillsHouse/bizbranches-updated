import CityPageClient from "./city-page-client"

export function generateStaticParams() {
  return [{ slug: '_placeholder' }];
}

export default function CityPage() {
  return <CityPageClient />;
}
