import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Terms of Service – ${SITE_NAME}`,
  description:
    "Terms of Service for BizBranches. Rules and guidelines for using our Pakistan free business listing directory.",
  keywords: "terms of service BizBranches, Pakistan business directory terms",
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: {
    title: `Terms of Service | ${SITE_NAME}`,
    description: "Terms of use for BizBranches Pakistan business directory.",
    url: `${SITE_URL}/terms`,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
