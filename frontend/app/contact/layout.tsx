import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Contact Us – ${SITE_NAME}`,
  description:
    "Contact BizBranches for business listing and support. Phone and email for Pakistan free business directory inquiries.",
  keywords: "contact BizBranches, business listing support Pakistan, directory contact",
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: `Contact Us | ${SITE_NAME}`,
    description: "Get in touch for business listing and support. Pakistan free business directory.",
    url: `${SITE_URL}/contact`,
    type: "website",
  },
  twitter: { card: "summary", title: `Contact | ${SITE_NAME}` },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
