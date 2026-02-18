import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Search Businesses in Pakistan – ${SITE_NAME}`,
  description:
    "Search Pakistan business directory by name, category, or city. Find local businesses, read reviews, and get contact details. Free listing directory.",
  keywords: "search businesses Pakistan, business directory search, find local businesses Pakistan",
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: `Search Businesses | ${SITE_NAME}`,
    description: "Search Pakistan business directory by category, city, or name. Find local businesses.",
    url: `${SITE_URL}/search`,
    type: "website",
  },
  twitter: { card: "summary", title: `Search | ${SITE_NAME}` },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
