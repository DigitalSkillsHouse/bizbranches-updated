# Performance Optimizations Summary

## Homepage & Categories Loading

### 1. **Server-side data prefetch**
- **Before:** Homepage was fully client-rendered; categories and featured listings were fetched in the browser after load (waterfall).
- **After:** Homepage is a **server component** that fetches categories and featured businesses **in parallel** on the server (`lib/fetch-home-data.ts`) with a 5‑minute revalidate. Data is passed as props so the first paint has content.
- **Result:** No client-side wait for categories/featured; faster First Contentful Paint (FCP) and Time to Interactive (TTI).

### 2. **Categories section**
- **Initial data:** Accepts `initialCategories` from the server and renders immediately (no loading skeleton when data is present).
- **Background revalidate:** Still fetches `/api/categories?limit=24` in the background to refresh; no `nocache=1` so responses can be cached by the browser/backend.
- **Images:** Category cards use **Next/Image** with `fill`, `sizes`, and `loading="lazy"` for optimized, lazy-loaded images.
- **Asset paths:** Category image map updated to use existing `.webp` files in `/public` where available (e.g. `pakistani-restaurant-interior.webp`, `modern-hospital.webp`).

### 3. **Top listings (featured)**
- **Initial data:** Accepts `initialFeatured` from the server; when present, skips client-side fetch.
- **Result:** Featured carousel shows data on first paint when server prefetch succeeds.

### 4. **Below-the-fold lazy loading**
- **CategoriesSection**, **TopCitiesSection**, **HowItWorksSection**, **FAQSection** are loaded with **`next/dynamic`** and `loading` skeletons.
- **Result:** Smaller initial JS bundle; hero and top listings paint first; other sections load as the user scrolls or shortly after.

### 5. **Backend caching**
- **Featured businesses:** `GET /api/business/featured` now sets  
  `Cache-Control: s-maxage=300, stale-while-revalidate=600`  
  so CDN/browser can cache for 5 minutes and revalidate in the background.
- Categories route already had cache headers when `nocache` is not set.

### 6. **Next.js config**
- **Compression:** `compress: true` (gzip).
- **Security:** `poweredByHeader: false`.
- **React:** `reactStrictMode: true`.
- **Images:** `remotePatterns` for Cloudinary; `domains` kept for compatibility.

### 7. **Loading state**
- **Root `loading.tsx`:** Shows a skeleton (hero + grid placeholders) while the server is preparing the page, so users see feedback immediately on navigation.

---

## Files changed / added

| Area | Files |
|------|--------|
| Homepage | `app/page.tsx` (server component, prefetch), `app/loading.tsx` (skeleton) |
| Data fetch | `lib/fetch-home-data.ts` (new) |
| Client shell | `components/home-page-client.tsx` (new, dynamic imports + props) |
| Categories | `components/categories-section.tsx` (initialCategories, Next/Image, cache-friendly fetch) |
| Top listings | `components/top-listings-section.tsx` (initialFeatured, skip fetch when provided) |
| Backend | `backend/routes/business.ts` (Cache-Control on featured) |
| Config | `frontend/next.config.mjs` (compress, remotePatterns, etc.) |

---

## What to expect

- **First load:** Server fetches categories + featured once (cached for 5 min); HTML includes data for hero, featured, and categories so they render without waiting on client requests.
- **Categories cards:** Show immediately when server data is present; images load lazily and are optimized via Next/Image.
- **Below fold:** Sections load in separate chunks with skeletons, reducing initial JS and improving perceived speed.
- **Repeat visits:** Backend cache and browser cache reduce repeat requests for categories and featured.

For even faster cold starts, ensure `BACKEND_URL` (or equivalent) is set so the server can reach the API with low latency (e.g. same region on Railway).
