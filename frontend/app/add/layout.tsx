import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `How to Add Your Business in Pakistan – Free Listing | ${SITE_NAME}`,
  description:
    "How to add a business listing in Pakistan: go to BizBranches, fill in business name, category, city, address, phone, and submit. Free—no credit card. List restaurants, services, shops and more.",
  keywords:
    "add business free Pakistan, how to add business listing Pakistan, free business listing, Pakistan business directory, list your business",
  alternates: { canonical: `${SITE_URL}/add` },
  openGraph: {
    title: `Add Your Business Free | ${SITE_NAME}`,
    description: "Free business listing with instant visibility on our directory.",
    url: `${SITE_URL}/add`,
    type: "website",
  },
  twitter: { card: "summary", title: `List Your Business | ${SITE_NAME}` },
};

export default function AddLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}