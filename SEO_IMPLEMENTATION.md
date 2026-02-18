# On-Page SEO Implementation Summary

This document summarizes the on-page SEO factors implemented across the LocatorBranches project.

---

## 1. Schema Markup (JSON-LD)

| Schema Type | Where Used | Purpose |
|-------------|------------|---------|
| **Organization** | Root layout | Identifies the brand, logo, contact |
| **WebSite** | Root layout | Site identity + SearchAction (site search) |
| **LocalBusiness** | Business detail pages (`/[slug]`, `/business/[id]`) | Business name, address, phone, geo, **aggregateRating** when reviews exist |
| **BreadcrumbList** | Business & slug pages | Breadcrumb rich results (Home → Category → Business) |
| **FAQPage** | Homepage FAQ section | FAQ rich results in search |

- **File:** `lib/site.ts` – `SITE_URL` used for canonical and schema URLs.
- **Files:** `components/business-schema.tsx`, `components/breadcrumb-schema.tsx`, `components/faq-schema.tsx`.

---

## 2. Meta Title & Meta Description

- **Root layout:** Default title and description; **title template** `%s | LocatorBranches` for child pages.
- **metadataBase** set to `SITE_URL` so relative canonicals and OG URLs resolve correctly.
- **Per-page metadata** (title, description, canonical, Open Graph, Twitter) added via layout files:
  - `/about`, `/contact`, `/privacy`, `/terms`, `/search`, `/add`, `/pending`
  - `/category/[slug]`, `/city/[slug]` – dynamic titles/descriptions from slug/category/city name
  - `/[slug]` (business by slug) – business name, category, truncated description
  - `/business/[id]` – business name, category, description (fetched in layout)

---

## 3. Heading Structure

- **Single H1 per page:** Homepage H1 only in hero (“Discover Local Businesses & Branches Near You”). Header site name is a `<span>`, not an H1.
- **Logical hierarchy:** Hero tagline changed from `<h2>` to `<p>` so the outline is H1 → sections with H2 (e.g. “Top Listings”, “Categories”, “Frequently Asked Questions”).
- **About page:** One H1 (“About us”); “Developed by” changed from H1 to H2 to avoid duplicate H1.
- **Other pages:** Contact, Privacy, Terms, Search, Category, City, Business detail each use a single, descriptive H1.

---

## 4. Internal Linking

- **Header:** Home, Categories (anchor to `#categories-section`), Pending Listings, List Business (add).
- **Footer:** Home, Browse Businesses (search), List Your Business (add), About Us, Contact, Popular Categories (restaurants, healthcare, education, automotive, real estate, technology), Privacy Policy, Terms of Service, Sitemap (`/sitemap.xml`).
- **Business detail:** Breadcrumb (Home → Category → Business), “Recently Added” and “Similar Businesses” with links to other listings; category links use proper slugs.
- **Terms page:** Link to Contact; **Terms of Service** page added at `/terms` so footer link does not 404.

---

## 5. Canonical URLs

- **Root:** `alternates.canonical: "/"` (resolved with `metadataBase`).
- **All key routes** set `alternates.canonical` to absolute URL via `SITE_URL`:
  - Static: `/about`, `/contact`, `/privacy`, `/terms`, `/search`, `/add`, `/pending`
  - Dynamic: `/[slug]`, `/business/[id]`, `/category/[slug]`, `/city/[slug]`

---

## 6. Open Graph & Twitter Cards

- **Root layout:** Default OG and Twitter title, description, image (`/local-business-directory-city-buildings.webp`), `og:type: website`, `twitter:card: summary_large_image`.
- **Child pages:** Each layout that defines metadata also sets `openGraph` and `twitter` (title, description, url where applicable) so shares show the right title, description, and URL.

---

## 7. Robots & Technical

- **Root metadata:** `robots: { index: true, follow: true }`, `googleBot: { index: true, follow: true }`.
- **Pending page:** `robots: { index: false, follow: true }` so pending listings are not indexed.
- **Sitemap:** `next-sitemap` generates `sitemap.xml` (and index); footer “Sitemap” links to `/sitemap.xml`.
- **robots.txt:** Already allows all and references sitemap (in `public/robots.txt`).

---

## 8. Other SEO Details

- **Keywords:** Root and key layouts include `keywords` in metadata where relevant.
- **Authors / publisher:** Root sets `authors`, `creator`, `publisher` to site name.
- **Language:** Root `<html lang="en">` kept.
- **Breadcrumbs:** Visible breadcrumb nav on business pages; `aria-label="Breadcrumb"` and BreadcrumbList JSON-LD for rich results.
- **Image alt:** Business images use business name in `alt` (e.g. in business detail and cards).

---

## Environment

- **Canonical base URL:** Set `NEXT_PUBLIC_SITE_URL` in production (e.g. `https://bizbranches.pk`). If unset, `lib/site.ts` falls back to `https://bizbranches.pk` or Vercel URL when available.

---

## Files Touched / Added

| Area | Files |
|------|--------|
| Site config | `lib/site.ts` (new) |
| Root SEO | `app/layout.tsx` (metadata, Organization + WebSite schema) |
| Headings | `components/header.tsx`, `components/hero-section.tsx`, `app/about/page.tsx` |
| Schema | `components/business-schema.tsx` (aggregateRating, SITE_URL), `components/breadcrumb-schema.tsx` (new), `components/faq-schema.tsx` (new) |
| FAQ | `components/faq-section.tsx` (FAQSchema) |
| Business pages | `app/[slug]/page.tsx` (metadata, BreadcrumbSchema, BusinessSchema rating), `app/business/[id]/layout.tsx` (new), `app/business/[id]/page.tsx` (BusinessSchema, BreadcrumbSchema, nav) |
| Metadata layouts | `app/about/layout.tsx`, `app/contact/layout.tsx`, `app/privacy/layout.tsx`, `app/search/layout.tsx`, `app/add/layout.tsx`, `app/pending/layout.tsx`, `app/terms/layout.tsx` (new), `app/terms/page.tsx` (new), `app/category/[slug]/layout.tsx` (new), `app/city/[slug]/layout.tsx` (new) |
| Footer | `components/footer.tsx` (Sitemap → `/sitemap.xml`) |

All of the above together cover schema markup, heading structure, internal linking, meta title and description, canonicals, Open Graph, Twitter, and robots/sitemap for on-page SEO.
