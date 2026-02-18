import { Metadata } from "next"
import { SITE_NAME } from "@/lib/site"

export const metadata: Metadata = {
  title: `Listing Submitted Successfully | ${SITE_NAME}`,
  description: "Your business listing is now live. View your listing, add another business, or return home.",
  robots: { index: false, follow: true },
}

export default function AddSuccessLayout({
  children,
}: { children: React.ReactNode }) {
  return children
}
