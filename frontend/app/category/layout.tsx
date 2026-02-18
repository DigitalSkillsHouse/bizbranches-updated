import { SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata = {
  title: `Business Categories in Pakistan – Browse All Categories | ${SITE_NAME}`,
  description: "Complete list of business categories in Pakistan. Find restaurants, healthcare, education, retail, automotive, and more. Browse subcategories and discover local businesses across Pakistan.",
  keywords: "business categories in Pakistan, Pakistan business directory, list of business categories, industries in Pakistan, business types Pakistan",
  alternates: { canonical: `${SITE_URL}/category` },
  openGraph: {
    title: `Business Categories in Pakistan | ${SITE_NAME}`,
    description: "Browse all business categories and subcategories in Pakistan. Find local businesses by industry.",
    url: `${SITE_URL}/category`,
    type: "website",
  },
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
