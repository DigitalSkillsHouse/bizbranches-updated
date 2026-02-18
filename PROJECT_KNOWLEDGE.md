# BizBranches — Complete Project Knowledge Base

> **Purpose:** Single source of truth for the entire BizBranches codebase. Use this document as context before making any major change.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Backend Deep Dive](#5-backend-deep-dive)
   - 5.1 Entry Point & Middleware
   - 5.2 Database & Models
   - 5.3 API Endpoints (Complete Reference)
   - 5.4 Utility Libraries
   - 5.5 Security & Rate Limiting
6. [Frontend Deep Dive](#6-frontend-deep-dive)
   - 6.1 Next.js App Router Structure
   - 6.2 Pages & Routing
   - 6.3 API Route Proxies
   - 6.4 Components (All)
   - 6.5 Hooks
   - 6.6 Lib / Utilities
7. [Database Schema](#7-database-schema)
8. [Environment Variables](#8-environment-variables)
9. [SEO Implementation](#9-seo-implementation)
10. [Performance Optimizations](#10-performance-optimizations)
11. [Deployment (Railway)](#11-deployment-railway)
12. [Key Business Logic](#12-key-business-logic)
13. [Third-Party Integrations](#13-third-party-integrations)
14. [Known Patterns & Conventions](#14-known-patterns--conventions)

---

## 1. Project Overview

**BizBranches** is a full-stack Pakistani business directory web application. Users can:

- Browse businesses by city, category, and area
- Search businesses with autocomplete and "near me" geolocation
- Submit new business listings (auto-approved)
- Leave reviews and ratings
- View business details with maps, contact info, and structured data

**Live URL:** `https://bizbranches.pk`

The app runs as a **single service** — an Express backend (port 3002 internally) and a Next.js frontend (port from Railway) are launched by `start.sh` in the same container.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | Next.js (App Router) | 15.2.4 |
| **UI Library** | React | 18.3.1 |
| **Styling** | Tailwind CSS | 4.1.9 |
| **UI Components** | shadcn/ui (Radix UI primitives) | 48 components |
| **Forms** | react-hook-form + zod | 7.60 / 3.25 |
| **Maps** | Leaflet + react-leaflet | 1.9.4 / 4.2.1 |
| **Icons** | lucide-react | 0.400 |
| **Backend Framework** | Express.js | 4.21.1 |
| **Database** | MongoDB (Atlas) | Driver 6.19 |
| **Image CDN** | Cloudinary | 2.5.1 |
| **Email** | Nodemailer (SMTP) | 6.9.16 |
| **Validation** | Zod | 3.25.67 |
| **File Upload** | Multer (memory) | 1.4.5 |
| **Geocoding** | Nominatim (free) / Google Geocoding (optional) | — |
| **Pakistan Cities** | Leopards Courier API + local JSON | 463+ cities |
| **Deployment** | Railway (nixpacks) | — |
| **Analytics** | Google Analytics 4 | — |
| **Ads** | Google AdSense | — |

---

## 3. Directory Structure

```
BizbranchesPk-main/
├── package.json                  # Root: runs both frontend + backend
├── start.sh                      # Production launcher (backend 3002 + frontend PORT)
├── nixpacks.toml                 # Railway build config
├── Procfile                      # web: npm start
├── .env.example                  # All environment variables template
│
├── backend/
│   ├── index.ts                  # Express entry point
│   ├── package.json
│   ├── tsconfig.json             # ES2020, CommonJS, strict
│   ├── render.yaml               # Render.com deploy config
│   │
│   ├── data/
│   │   └── pakistan-cities.json  # 463+ Pakistan cities (fallback)
│   │
│   ├── lib/
│   │   ├── models.ts            # Collections, indexes, default data seeding
│   │   ├── mongodb.ts           # Connection management (pool: 10)
│   │   ├── mongodb-profile.ts   # Separate profile DB connection
│   │   ├── schemas.ts           # Zod schemas + TypeScript types
│   │   ├── cloudinary.ts        # Image upload + CDN URL builder
│   │   ├── email.ts             # SMTP confirmation emails
│   │   ├── courier.ts           # Leopards Courier API client
│   │   ├── geocode.ts           # Address → lat/lng (Nominatim + Google)
│   │   ├── geo.ts               # Haversine distance + nearby tiers
│   │   ├── google-ping.ts       # Ping Google sitemap on new listings
│   │   ├── duplicate-check.ts   # Multi-field duplicate detection
│   │   ├── sanitize.ts          # Regex escaping for MongoDB queries
│   │   ├── rate-limit.ts        # In-memory per-IP rate limiter
│   │   ├── safe-error.ts        # Safe error messages (no stacks in prod)
│   │   └── logger.ts            # Environment-aware logger
│   │
│   └── routes/
│       ├── business.ts          # CRUD + list + featured + recent + nearby
│       ├── business-related.ts  # Related businesses
│       ├── admin.ts             # Admin submissions viewer
│       ├── search.ts            # Search suggestions
│       ├── categories.ts        # Category listing + subcategories
│       ├── cities.ts            # Cities (Leopards API + JSON fallback)
│       ├── provinces.ts         # Pakistan provinces
│       ├── areas.ts             # Areas by city (Leopards API)
│       ├── reviews.ts           # Review CRUD + rating aggregation
│       ├── profile.ts           # External profile lookup
│       ├── geocode.ts           # Geocoding proxy
│       ├── sitemap-api.ts       # Sitemap data for Next.js
│       ├── db-health.ts         # DB health check
│       └── debug.ts             # Debug info (dev only)
│
└── frontend/
    ├── package.json
    ├── tsconfig.json             # ES6, bundler resolution, @/* alias
    ├── next.config.mjs           # Rewrites /api/* → backend, redirects, images
    ├── middleware.ts              # Security headers, CSP, redirects
    ├── amplify.yml               # AWS Amplify build (alternative deploy)
    │
    ├── app/
    │   ├── layout.tsx            # Root layout: fonts, SEO, analytics, header/footer
    │   ├── page.tsx              # Home: server-side fetch, passes to HomePageClient
    │   ├── globals.css           # Design system tokens, Tailwind config
    │   ├── loading.tsx           # Root loading skeleton
    │   ├── not-found.tsx         # 404 page
    │   ├── NotFoundContent.tsx   # 404 content component
    │   │
    │   ├── [slug]/              # Business detail by slug
    │   │   ├── page.tsx          # SSR: fetch business, reviews, related
    │   │   ├── [category]/       # City + Category listing
    │   │   │   ├── page.tsx
    │   │   │   ├── city-category-page-client.tsx
    │   │   │   └── [area]/       # City + Category + Area listing
    │   │   │       ├── page.tsx
    │   │   │       └── city-category-area-page-client.tsx
    │   │
    │   ├── business/[id]/        # Business detail by MongoDB _id
    │   │   ├── page.tsx
    │   │   ├── layout.tsx
    │   │   └── loading.tsx
    │   │
    │   ├── category/
    │   │   ├── page.tsx           # Category index
    │   │   ├── category-index-client.tsx
    │   │   ├── fetch-categories-index.ts
    │   │   └── [slug]/            # Category detail
    │   │       ├── page.tsx
    │   │       ├── category-page-client.tsx
    │   │       ├── layout.tsx
    │   │       └── loading.tsx
    │   │
    │   ├── city/[slug]/           # City page
    │   │   ├── page.tsx
    │   │   └── layout.tsx
    │   │
    │   ├── search/                # Search page with filters
    │   │   ├── page.tsx
    │   │   ├── layout.tsx
    │   │   └── loading.tsx
    │   │
    │   ├── add/                   # Submit new business
    │   │   ├── page.tsx           # Multi-step form
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   └── success/           # Submission success
    │   │       ├── page.tsx
    │   │       └── layout.tsx
    │   │
    │   ├── about/page.tsx
    │   ├── contact/page.tsx
    │   ├── privacy/page.tsx
    │   ├── terms/page.tsx
    │   ├── pending/page.tsx       # Pending listings viewer
    │   │
    │   ├── api/                   # Next.js API routes (proxy to backend)
    │   │   ├── business/route.ts          # GET list, POST create
    │   │   ├── business/[id]/route.ts     # GET single
    │   │   ├── business/featured/route.ts
    │   │   ├── business/nearby/route.ts
    │   │   ├── business/recent/route.ts
    │   │   ├── business/check-duplicates/route.ts
    │   │   ├── categories/route.ts
    │   │   ├── cities/route.ts
    │   │   ├── cities/countries/route.ts
    │   │   ├── geo/route.ts
    │   │   ├── geocode/route.ts
    │   │   ├── provinces/route.ts
    │   │   └── reviews/route.ts
    │   │
    │   ├── sitemap.xml/route.ts   # Sitemap index
    │   ├── sitemap/pages.xml/route.ts
    │   ├── sitemap/businesses/[page]/route.ts
    │   └── llms.txt/route.ts
    │
    ├── components/
    │   ├── home-page-client.tsx        # Homepage orchestrator (dynamic imports)
    │   ├── hero-section.tsx            # Hero with search + autocomplete
    │   ├── header.tsx                  # Site header + mobile menu
    │   ├── footer.tsx                  # Site footer + links
    │   ├── global-topbar.tsx           # Global search bar (not on home)
    │   ├── global-container.tsx        # Width wrapper based on route
    │   ├── categories-section.tsx      # Category grid with expand/collapse
    │   ├── top-cities-section.tsx      # Top Pakistan cities grid
    │   ├── top-listings-section.tsx    # Recent listings carousel (Embla)
    │   ├── how-it-works-section.tsx    # 4-step process with animations
    │   ├── seo-intro-section.tsx       # SEO keyword section
    │   ├── faq-section.tsx             # FAQ accordion
    │   ├── cta-add-business.tsx        # CTA button/link
    │   ├── listing-card.tsx            # Business card (3 variants)
    │   ├── listing-card-skeleton.tsx   # Loading skeleton
    │   ├── search-bar.tsx              # Search with filters + autocomplete
    │   ├── search-filters.tsx          # Sidebar search filters
    │   ├── location-map-confirm.tsx    # Map dialog for location picking
    │   ├── location-map-inner.tsx      # Leaflet map with draggable marker
    │   ├── business-schema.tsx         # LocalBusiness JSON-LD
    │   ├── breadcrumb-schema.tsx       # BreadcrumbList JSON-LD
    │   ├── faq-schema.tsx              # FAQPage JSON-LD
    │   ├── adsense-slot.tsx            # Google AdSense slot
    │   ├── ad-section.tsx              # Ad wrapper
    │   ├── ad-banner.tsx               # Header/footer ad banner
    │   ├── copy-deterrent.tsx          # Prevents right-click, F12, Ctrl+U
    │   ├── pwa-register.tsx            # Service worker registration
    │   ├── offline-banner.tsx          # Offline detection banner
    │   ├── fancy-loader.tsx            # SVG animated loader
    │   └── ui/                         # 48 shadcn/ui primitives (Radix-based)
    │
    ├── hooks/
    │   ├── use-api-cache.ts       # API response caching with TTL
    │   ├── use-debounce.ts        # Value debouncing
    │   ├── use-mobile.ts          # Mobile viewport detection
    │   ├── use-toast.ts           # Toast notification system
    │   └── use-user-location.ts   # Browser geolocation + IP fallback
    │
    ├── lib/
    │   ├── api.ts                 # Backend URL helper
    │   ├── types.ts               # ListingBusiness, ListingCardVariant
    │   ├── utils.ts               # cn(), slugify(), truncate(), getBusinessLogoUrl()
    │   ├── city-slug.ts           # City slug ↔ name mapping
    │   ├── fetch-home-data.ts     # Server-side homepage data fetch
    │   ├── site.ts                # SITE_URL, SITE_NAME constants
    │   ├── sitemap.ts             # Sitemap XML helpers
    │   ├── mock-data.ts           # Mock data for dev/fallback
    │   └── logger.ts              # Dev-only console logger
    │
    └── public/
        ├── manifest.json          # PWA manifest
        ├── robots.txt             # Search engine directives
        ├── sw.js                  # Service worker
        ├── BizBranches.jpeg       # Logo
        └── *.webp                 # City/category hero images
```

---

## 4. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Container                      │
│                                                           │
│  ┌─────────────────┐     ┌──────────────────────────┐    │
│  │  Express Backend │     │    Next.js Frontend       │    │
│  │  (port 3002)     │◄────│    (port $PORT)           │    │
│  │                   │     │                            │    │
│  │  /api/*          │     │  Server Components         │    │
│  │  - business      │     │  - SSR pages               │    │
│  │  - categories    │     │  - API route proxies       │    │
│  │  - cities        │     │                            │    │
│  │  - search        │     │  Client Components         │    │
│  │  - reviews       │     │  - React + Tailwind        │    │
│  │  - admin         │     │  - Leaflet maps            │    │
│  │  - geocode       │     │  - AdSense                 │    │
│  └────────┬─────────┘     └──────────────────────────┘    │
│           │                                                │
└───────────┼────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────┐  ┌──────────────┐  ┌───────────────┐
│  MongoDB Atlas    │  │  Cloudinary  │  │  Leopards API │
│  (businesses,     │  │  (images)    │  │  (PK cities)  │
│   categories,     │  └──────────────┘  └───────────────┘
│   cities, reviews)│
└───────────────────┘
```

### Request Flow

1. **Browser** → Next.js frontend (port from Railway)
2. **Next.js API routes** (`/api/*`) → rewritten to Express backend (`localhost:3002`)
3. **Express backend** → MongoDB Atlas, Cloudinary, Leopards API, SMTP
4. **Server components** fetch directly from backend during SSR
5. **Client components** call Next.js API routes which proxy to backend

---

## 5. Backend Deep Dive

### 5.1 Entry Point & Middleware (`backend/index.ts`)

- **Express** app on configurable `PORT` (default 3001, production 3002 via start.sh)
- **CORS**: allows localhost:3000, FRONTEND_URL, NEXT_PUBLIC_SITE_URL
- **Rate Limiting**: 300 requests/minute global per IP
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **Body Parsing**: JSON + URL-encoded (512KB limit)
- **Startup**: calls `initializeDefaultData()` to seed categories and cities

### 5.2 Database & Models

**Collections:**
| Collection | Purpose |
|-----------|---------|
| `businesses` | Business listings (main data) |
| `categories` | Business categories with subcategories |
| `cities` | City directory |
| `reviews` | Business reviews and ratings |

**Index Strategy (created on startup):**
- `businesses`: compound (category+city), status, featured, createdAt, unique slug, text search (name+description+category+city+area), duplicate-check fields, 2dsphere geo index
- `categories`: unique slug, isActive
- `cities`: unique slug, isActive
- `reviews`: compound (businessId+createdAt), compound (businessId+rating)

**Default Data Seeded:**
- 6 categories: Restaurants, Healthcare, Education, Automotive, Beauty & Salon, Shopping
- 50+ cities: Pakistan cities + global cities (US, UK, Canada, Australia, UAE, Saudi Arabia)

### 5.3 API Endpoints (Complete Reference)

#### Business Routes (`/api/business`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/business` | — | — | List businesses (paginated, filtered by category/city/area/search) |
| GET | `/api/business/pending` | — | — | List pending submissions |
| GET | `/api/business/featured` | — | — | Featured businesses (cache: 5min) |
| GET | `/api/business/recent` | — | — | Recent approved (cache: 5min) |
| GET | `/api/business/nearby` | — | — | Geo-based search (max 10km, cache: 1min) |
| GET | `/api/business/:slug` | — | — | Single business by slug or _id (cache: 1hr) |
| POST | `/api/business` | — | 10/min | Create business (FormData with logo) |
| POST | `/api/business/check-duplicates` | — | 60/min | Check for duplicate fields |
| PATCH | `/api/business` | Admin | — | Approve/reject (x-admin-secret header) |

**Business creation flow:**
1. Validate with Zod (CreateBusinessSchema)
2. Generate slug from name
3. Geocode address → lat/lng (if not provided)
4. Check duplicates (name+city+category, phone, email, URLs)
5. Upload logo to Cloudinary
6. Insert into MongoDB (status: approved, approvedBy: auto)
7. Send confirmation email (SMTP)
8. Ping Google sitemap

**Search scoring (GET /api/business with `q` param):**
- Category exact match: +100
- Subcategory match: +40
- Name starts with query: +30
- Name contains query: +20
- Description contains: +5

#### Other Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/business/related` | — | 2 related businesses (same category+city) |
| GET | `/api/search` | — | Search suggestions (5 businesses + 3 categories) |
| GET | `/api/categories` | — | All categories with subcategories |
| GET | `/api/cities` | — | Cities (Pakistan from Leopards API/JSON, global hardcoded) |
| GET | `/api/cities/countries` | — | Available countries |
| GET | `/api/provinces` | — | Pakistan provinces (7 regions) |
| GET | `/api/areas` | — | Areas by cityId (Leopards API proxy) |
| GET | `/api/reviews` | — | Reviews for a business + aggregates |
| POST | `/api/reviews` | — | Submit review (20/min rate limit) |
| GET | `/api/geocode` | — | Geocode address → lat/lng (20/min) |
| GET | `/api/profile` | — | External profile lookup by username |
| GET | `/api/admin/submissions` | Admin | Auto-approved submissions log |
| GET | `/api/sitemap/businesses` | — | Paginated slugs for sitemap |
| GET | `/api/sitemap/geo-pages` | — | City+category combos for sitemap |
| GET | `/api/db-health` | — | Database ping |
| GET | `/api/debug` | — | Debug info (dev only) |
| GET | `/api/ping` | — | Health check (no DB) |

### 5.4 Utility Libraries

| File | Purpose | Key Exports |
|------|---------|-------------|
| `mongodb.ts` | Connection pool (max 10, 5s timeout) | `getDb()`, `closeDb()` |
| `schemas.ts` | Zod validation schemas | `BusinessSchema`, `CreateBusinessSchema`, `CategorySchema`, `CitySchema`, `ReviewSchema` |
| `cloudinary.ts` | Image upload + CDN URLs | `cloudinary`, `buildCdnUrl()` |
| `email.ts` | SMTP confirmation emails | `sendConfirmationEmail()` |
| `courier.ts` | Leopards API client (token caching) | `getCourierToken()`, `courierGet()`, `courierPost()` |
| `geocode.ts` | Nominatim/Google geocoding (24h cache, rate limited) | `geocodeAddress()` |
| `geo.ts` | Haversine distance formula | `haversineKm()`, `NEARBY_TIERS_KM` |
| `duplicate-check.ts` | Multi-field duplicate detection | `checkDuplicateBusiness()`, `hasAnyConflict()` |
| `google-ping.ts` | Ping Google with sitemap URLs | `pingGoogleSitemap()` |
| `sanitize.ts` | MongoDB query safety | `escapeRegex()`, `safeSearchQuery()` |
| `rate-limit.ts` | In-memory per-IP limiter (60s window) | `rateLimit()`, `globalRateLimit()` |
| `safe-error.ts` | Production-safe error messages | `getSafeErrorMessage()` |
| `logger.ts` | Environment-aware logging | `logger.log/warn/info/error()` |

### 5.5 Security & Rate Limiting

- **Global rate limit**: 300 req/min per IP
- **Per-endpoint limits**: POST business (10/min), check-duplicates (60/min), reviews (20/min), geocode (20/min)
- **Admin auth**: `x-admin-secret` header or Bearer token matched against `ADMIN_SECRET` env var
- **Input sanitization**: regex escaping, max 200 char search queries
- **Security headers**: nosniff, deny framing, XSS protection, strict referrer
- **Request size**: 512KB JSON/URL-encoded limit

---

## 6. Frontend Deep Dive

### 6.1 Next.js App Router Structure

- **Server Components**: Home page, business detail, city/category pages (SSR with data)
- **Client Components**: Forms, search, interactive sections (marked `"use client"`)
- **API Routes**: Proxy layer forwarding to Express backend
- **Middleware**: Security headers + CSP + redirects
- **Rewrites**: `next.config.mjs` maps `/api/*` → backend URL
- **ISR**: 5-minute revalidation on homepage data

### 6.2 Pages & Routing

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server | Homepage — fetches categories + recent, renders HomePageClient |
| `/[slug]` | Server | Business detail by slug (SSR: business, reviews, related) |
| `/[slug]/[category]` | Server | Businesses in city+category |
| `/[slug]/[category]/[area]` | Server | Businesses in city+category+area |
| `/business/[id]` | Server | Business detail by MongoDB _id |
| `/category` | Server | Category index page |
| `/category/[slug]` | Server | Category detail with filtering |
| `/city/[slug]` | Server | City page |
| `/search` | Client | Search with filters, sorting, infinite scroll |
| `/add` | Client | Multi-step business submission form |
| `/add/success` | Client | Submission success + ad placements |
| `/about` | Client | About page |
| `/contact` | Client | Contact page with NAP info |
| `/privacy` | Client | Privacy policy |
| `/terms` | Client | Terms of service |
| `/pending` | Client | Pending listings viewer |
| `/sitemap.xml` | API | Sitemap index |
| `/sitemap/pages.xml` | API | Static + dynamic pages sitemap |
| `/sitemap/businesses/[page]` | API | Business listings sitemap (paginated) |

**Redirects (in next.config.mjs):**
- `/business/:slug` → `/:slug` (permanent)
- `/city/:path*/business/:slug` → `/:slug` (permanent)
- `/category/:path*/business/:slug` → `/:slug` (permanent)

### 6.3 API Route Proxies

All frontend API routes in `app/api/` forward requests to the Express backend. They:
1. Read query params or request body
2. Fetch from `NEXT_PUBLIC_BACKEND_URL` (default: `http://localhost:3002`)
3. Return the response with appropriate headers
4. Include fallback static data when backend is unreachable (categories, cities, provinces)

### 6.4 Components (All 29 + 48 UI)

#### Layout & Navigation
| Component | Description |
|-----------|-------------|
| `header.tsx` | Site header with logo, nav links, mobile hamburger menu, directories dropdown |
| `footer.tsx` | Footer with links, stats (50+ cities, 20+ categories), contact info, popular categories |
| `global-topbar.tsx` | Global search bar shown on all pages except homepage and business detail |
| `global-container.tsx` | Content width wrapper that adjusts based on current route |

#### Homepage Sections
| Component | Description |
|-----------|-------------|
| `home-page-client.tsx` | Orchestrates homepage — accepts SSR data, uses dynamic imports for below-fold sections |
| `hero-section.tsx` | Hero banner with search input, city selector, autocomplete suggestions (debounced) |
| `categories-section.tsx` | Category grid with expand/collapse (fetches 24 initially, 200 on expand). SessionStorage cache |
| `top-cities-section.tsx` | Grid of top Pakistan cities with images and business counts |
| `top-listings-section.tsx` | Recent listings carousel (Embla). Accepts `initialRecent` from SSR or fetches client-side |
| `how-it-works-section.tsx` | 4-step process cards with IntersectionObserver scroll animations |
| `seo-intro-section.tsx` | SEO-focused intro section with feature cards |
| `faq-section.tsx` | FAQ accordion with FAQPage schema markup |
| `cta-add-business.tsx` | CTA button/link in 3 variants: inline, block, sticky |

#### Business Display
| Component | Description |
|-----------|-------------|
| `listing-card.tsx` | Business card in 3 variants (compact, card, mini). Memoized. Handles logo fallbacks |
| `listing-card-skeleton.tsx` | Loading skeleton matching listing-card dimensions |

#### Search
| Component | Description |
|-----------|-------------|
| `search-bar.tsx` | Full search with city/category dropdowns, autocomplete, abort controller |
| `search-filters.tsx` | Sidebar filters: query, city, category. Reads/writes URL params |

#### Maps
| Component | Description |
|-----------|-------------|
| `location-map-confirm.tsx` | Dialog with map for picking/confirming business location |
| `location-map-inner.tsx` | Leaflet map with OpenStreetMap tiles and draggable marker |

#### SEO Schemas (JSON-LD)
| Component | Description |
|-----------|-------------|
| `business-schema.tsx` | LocalBusiness structured data (name, address, geo, aggregateRating) |
| `breadcrumb-schema.tsx` | BreadcrumbList structured data |
| `faq-schema.tsx` | FAQPage structured data |

#### Ads
| Component | Description |
|-----------|-------------|
| `adsense-slot.tsx` | Google AdSense slot renderer |
| `ad-section.tsx` | Wrapper around AdSenseSlot |
| `ad-banner.tsx` | Header or sticky-footer ad banner |

#### Utility Components
| Component | Description |
|-----------|-------------|
| `copy-deterrent.tsx` | Prevents right-click, F12, Ctrl+U, image drag |
| `pwa-register.tsx` | Service worker registration (production only) |
| `offline-banner.tsx` | Shows banner when browser is offline |
| `fancy-loader.tsx` | SVG animated loading spinner |

#### UI Primitives (`components/ui/`)
48 shadcn/ui components based on Radix UI: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip

### 6.5 Hooks

| Hook | Description |
|------|-------------|
| `use-api-cache.ts` | API response caching with TTL + stale-while-revalidate. In-memory cache |
| `use-debounce.ts` | Debounces any value with configurable delay |
| `use-mobile.ts` | Detects viewport < 768px using `matchMedia` |
| `use-toast.ts` | Toast notification system (reducer-based, limit: 1) |
| `use-user-location.ts` | Browser geolocation + IP-based fallback. SessionStorage cache (30min TTL). `parseNearMeQuery()` helper |

### 6.6 Lib / Utilities

| File | Key Exports | Description |
|------|-------------|-------------|
| `api.ts` | `getBackendUrl()` | Returns backend URL from env vars (fallback: localhost:3002) |
| `types.ts` | `ListingBusiness`, `ListingCardVariant` | TypeScript types for business listings |
| `utils.ts` | `cn()`, `slugify()`, `truncate()`, `getBusinessLogoUrl()` | Tailwind class merge, slug generation, text truncation, Cloudinary URL builder |
| `city-slug.ts` | `citySlugToName()`, `cityNameToSlug()`, `areaToSlug()` | Static city slug ↔ name mapping |
| `fetch-home-data.ts` | `fetchHomeCategories()`, `fetchHomeRecent()` | Server-side homepage data fetching with 5min revalidation |
| `site.ts` | `SITE_URL`, `SITE_NAME`, `SITE_DESCRIPTION` | Site constants from env vars |
| `sitemap.ts` | `getBaseUrl()`, `escapeXml()`, `urlEntry()` | XML sitemap generation helpers |
| `mock-data.ts` | Mock businesses, cities, categories | Development/fallback data |
| `logger.ts` | `logger.log/warn/error/info()` | Dev-only console logger (no-op in production) |

---

## 7. Database Schema

### Business Document

```typescript
{
  _id: ObjectId,
  name: string,                    // 1-100 chars
  slug: string,                    // unique, URL-safe
  category: string,                // e.g. "Restaurants"
  subCategory?: string,            // e.g. "Fast Food"
  country: string,
  province?: string,
  city: string,
  area?: string,
  postalCode?: string,             // 3-12 chars
  address: string,                 // 1-500 chars
  phone: string,                   // Pakistan format: +923XXXXXXXXX
  phoneDigits: string,             // normalized (digits only)
  contactPerson?: string,
  whatsapp: string,                // Pakistan format
  email: string,
  description: string,             // 500-2000 chars
  websiteUrl?: string,
  websiteNormalized?: string,      // host+path, no protocol
  facebookUrl?: string,
  gmbUrl?: string,                 // Google My Business
  youtubeUrl?: string,
  profileUsername?: string,
  swiftCode?: string,
  branchCode?: string,
  cityDialingCode?: string,
  iban?: string,
  logoUrl?: string,                // Cloudinary URL
  logoPublicId?: string,           // Cloudinary public ID
  status: "pending" | "approved" | "rejected",
  approvedAt?: Date,
  approvedBy?: "auto" | "admin",
  featured: boolean,
  featuredAt?: Date,
  ratingAvg?: number,
  ratingCount?: number,
  latitude?: number,               // -90 to 90
  longitude?: number,              // -180 to 180
  locationVerified: boolean,
  location?: {                     // GeoJSON for $geoNear
    type: "Point",
    coordinates: [longitude, latitude]
  },
  createdAt: Date,
  updatedAt?: Date
}
```

### Category Document

```typescript
{
  _id: ObjectId,
  name: string,
  slug: string,                    // unique
  icon?: string,
  description?: string,
  imageUrl?: string,
  imagePublicId?: string,
  count: number,
  isActive: boolean,
  subcategories?: [{ name: string, slug: string }],
  createdAt: Date
}
```

### City Document

```typescript
{
  _id: ObjectId,
  name: string,
  slug: string,                    // unique
  province?: string,
  country: string,
  isActive: boolean,
  createdAt: Date
}
```

### Review Document

```typescript
{
  _id: ObjectId,
  businessId: string,              // MongoDB ObjectId as string
  name: string,                    // 1-100 chars
  rating: number,                  // 1-5
  comment: string,                 // 3-1000 chars
  createdAt: Date
}
```

---

## 8. Environment Variables

### Required

| Variable | Where | Description |
|----------|-------|-------------|
| `MONGODB_URI` | Backend | MongoDB Atlas connection string |
| `MONGODB_DB` | Backend | Database name (default: "BizBranches") |

### Backend — Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port (3002 in production via start.sh) |
| `HOST` | 0.0.0.0 | Server host |
| `NODE_ENV` | — | production / development |
| `FRONTEND_URL` | — | Frontend URL for CORS |
| `SITE_URL` | — | Used in emails |
| `ADMIN_SECRET` | — | Admin API authentication |
| `CLOUDINARY_CLOUD_NAME` | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | — | Cloudinary API secret |
| `SMTP_HOST` | — | SMTP server for emails |
| `SMTP_PORT` | 465 | SMTP port |
| `SMTP_SECURE` | true | Use TLS |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `EMAIL_FROM` | — | From address |
| `EMAIL_FROM_NAME` | — | From display name |
| `EMAIL_REPLY_TO` | — | Reply-to address |
| `SUPPORT_EMAIL` | — | Support email |
| `LEOPARDS_API_BASE_URL` | — | Leopards Courier API base |
| `LEOPARDS_API_KEY` | — | Leopards API key |
| `LEOPARDS_API_PASSWORD` | — | Leopards API password |
| `GOOGLE_GEOCODING_API_KEY` | — | Google Geocoding (optional, Nominatim is default) |
| `MONGODB_PROFILE_URI` | — | Separate profile DB connection |
| `MONGODB_PROFILE_DB` | — | Profile DB name |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | http://localhost:3002 | Backend API URL |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | — | Cloudinary cloud name (client-side) |
| `NEXT_PUBLIC_SITE_URL` | https://bizbranches.pk | Public site URL |
| `NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_ABOVE_FOLD` | — | AdSense slot for success page |
| `NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_IN_CONTENT` | — | AdSense slot for success page |
| `NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_FOOTER` | — | AdSense slot for success page |

---

## 9. SEO Implementation

### Structured Data (JSON-LD)
- **Organization** + **WebSite** schema in root layout
- **LocalBusiness** schema on business detail pages (with aggregateRating)
- **BreadcrumbList** on business pages
- **FAQPage** on homepage FAQ section
- **ItemList** on city+category listing pages

### Meta Tags
- Root layout: default title, description, keywords, robots, OpenGraph, Twitter
- Per-page metadata via layout files (dynamic titles from slugs/data)
- Title template: `%s | BizBranches`
- Canonical URLs on all pages

### Sitemaps
- **Sitemap index** at `/sitemap.xml`
- **Static pages** sitemap at `/sitemap/pages.xml` (includes category/city combos)
- **Business sitemaps** at `/sitemap/businesses/[page]` (45,000 URLs per page)
- Google sitemap ping on new business creation

### Technical SEO
- `robots.txt` in public (allows all, references sitemap)
- Security headers via middleware
- Redirects: old URL patterns → canonical slugs
- `lang="en"` on HTML element

---

## 10. Performance Optimizations

1. **Server-side data prefetch**: Homepage fetches categories + recent businesses on server with 5min ISR
2. **Dynamic imports**: Below-fold sections loaded with `next/dynamic` + loading skeletons
3. **Image optimization**: Next/Image with Cloudinary remote patterns, lazy loading, responsive sizes
4. **HTTP caching**: Featured (5min), categories (1hr), provinces (1day), business detail (1hr)
5. **Client caching**: SessionStorage for cities/categories, in-memory API cache with TTL
6. **Database indexes**: Compound indexes for common queries, text search, 2dsphere geo
7. **Connection pooling**: MongoDB max 10 connections
8. **Geocoding cache**: In-memory 24hr TTL, max 5000 entries
9. **Debounced search**: Autocomplete waits for user to stop typing
10. **Abort controllers**: Cancels in-flight search requests on new input
11. **Memoized components**: `listing-card.tsx` wrapped in `React.memo`
12. **Production optimizations**: Console removal, no source maps, gzip compression

---

## 11. Deployment (Railway)

### Single Service Setup
- `start.sh` launches backend on port 3002, then frontend on Railway's `$PORT`
- Both run in same container, frontend proxies to backend via localhost

### Build & Start
| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Start Command | `npm start` (runs `start.sh`) |
| Root Directory | (empty — repo root) |
| Build System | nixpacks |

### Required Railway Variables
- `MONGODB_URI` (with real Atlas connection string, not placeholder)
- `MONGODB_DB`
- `CLOUDINARY_*` (for image uploads)
- SMTP variables (for confirmation emails)

### Key Notes
- Railway sets `PORT` automatically — do NOT set it to 3001/3002
- `BACKEND_URL` and `NEXT_PUBLIC_BACKEND_URL` are set inside `start.sh` to `http://localhost:3002`
- MongoDB Atlas Network Access must allow `0.0.0.0/0` for Railway

---

## 12. Key Business Logic

### Business Submission Flow
1. User fills multi-step form (5 sections)
2. Client-side validation (Zod schema)
3. Duplicate check API call (phone, email, name+city+category, URLs)
4. If no duplicates → submit with FormData (includes logo file)
5. Backend: validate → generate slug → geocode → check duplicates → upload logo → insert → auto-approve → email → ping Google
6. Redirect to success page

### Validation Rules
- **Phone**: Pakistan format (+92, 10 digits starting with 3)
- **Description**: 500-2000 characters
- **Required URL**: At least one of websiteUrl or facebookUrl
- **Unique fields**: slug, phone, email, website URL

### Duplicate Detection
Checks 7 fields for conflicts:
1. Name + City + Category (case-insensitive)
2. Phone (normalized digits)
3. WhatsApp
4. Email
5. Website URL (normalized)
6. Facebook URL
7. Google My Business URL

### Review System
- Rating: 1-5 stars
- Comment: 3-1000 characters
- Aggregation: ratingAvg and ratingCount recalculated on GET and updated atomically on POST
- No authentication required

### Search System
- **Autocomplete**: Debounced, returns 5 businesses + 3 categories
- **Full search**: Paginated, filterable by city/category/area, scored by relevance
- **Near me**: Browser geolocation or IP-based, MongoDB $geoNear within 10km
- **Sorting**: relevance (default), name, date, rating

---

## 13. Third-Party Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| **MongoDB Atlas** | Primary database | `MONGODB_URI` |
| **Cloudinary** | Image upload + CDN | `CLOUDINARY_CLOUD_NAME/KEY/SECRET` |
| **Leopards Courier API** | Pakistan cities + areas | `LEOPARDS_API_*` |
| **Nominatim (OSM)** | Free geocoding (default) | No key needed |
| **Google Geocoding** | Premium geocoding (optional) | `GOOGLE_GEOCODING_API_KEY` |
| **Google Analytics 4** | Website analytics | Hardcoded in layout |
| **Google AdSense** | Ad monetization | `NEXT_PUBLIC_ADSENSE_SLOT_*` |
| **SMTP (Nodemailer)** | Confirmation emails | `SMTP_*` variables |

---

## 14. Known Patterns & Conventions

### Code Patterns
- **Server Components** for data-fetching pages, **Client Components** for interactivity
- **Zod** for all validation (shared schemas in `backend/lib/schemas.ts`)
- **slugify** pattern: business names → URL-safe slugs (unique in DB)
- **Fallback data**: Most frontend API routes have static fallback data when backend is unavailable
- **Cache headers**: Set by backend routes, respected by Next.js and browser
- **Error boundaries**: Safe error messages in production, verbose in development

### File Naming
- `page.tsx` — Next.js page component
- `layout.tsx` — Next.js layout (metadata + wrappers)
- `loading.tsx` — Next.js loading state
- `*-client.tsx` — Client-side page component
- `route.ts` — Next.js API route handler

### Styling
- **Tailwind CSS v4** with custom design tokens in `globals.css`
- **shadcn/ui** components (Radix primitives) in `components/ui/`
- **Geist Sans** font family
- **Color system**: Primary (blue #1d4ed8), Accent (green #059669), with semantic tokens
- **8px spacing** base with CSS custom properties

### State Management
- No global state library — React hooks + URL params
- SessionStorage for caching (cities, categories)
- In-memory cache for API responses (use-api-cache hook)
- URL search params for search/filter state

---

*Last updated: February 2026*
