import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `About Us – ${SITE_NAME}`,
  description:
    "Learn about BizBranches – Pakistan's free business listing directory. Our mission is to connect businesses with customers. Find local businesses, add your business free, read reviews.",
  keywords: "about BizBranches, Pakistan business directory, free business listing Pakistan",
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: `About Us | ${SITE_NAME}`,
    description: "Pakistan's free business listing directory. Connect with local businesses and add your business free.",
    url: `${SITE_URL}/about`,
    type: "website",
  },
  twitter: { card: "summary", title: `About Us | ${SITE_NAME}` },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
