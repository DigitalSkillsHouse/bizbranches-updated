"use client";

import Link from "next/link";
import { Building2, Search, MapPin, Star, CheckCircle } from "lucide-react";

/**
 * SEO-optimized intro section for homepage. Targets "Pakistan free business listing directory",
 * "business categories in Pakistan", and related LSI keywords. Designed for clarity and conversion.
 */
export function SEOIntroSection() {
  return (
    <section
      className="w-full border-y border-gray-100 bg-gradient-to-b from-slate-50/80 to-white"
      aria-labelledby="what-is-bizbranches"
    >
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 max-w-5xl">
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-wide mb-4">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Pakistan&apos;s Free Business Directory
          </span>
          <h2
            id="what-is-bizbranches"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight"
          >
            What is BizBranches?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            BizBranches is Pakistan&apos;s free business listing directory. Find local businesses by city and{" "}
            <Link href="/category" className="text-primary font-medium hover:underline">
              business categories in Pakistan
            </Link>
            , and list your own business at no cost—no fees, no credit card.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-12">
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Search &amp; Discover</h3>
              <p className="text-sm text-gray-600">Find restaurants, clinics, shops, and services by category and city.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Browse by Location</h3>
              <p className="text-sm text-gray-600">Karachi, Lahore, Islamabad, and more—find businesses near you.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Free Listings</h3>
              <p className="text-sm text-gray-600">Contact details, address, website—all visible to customers.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">No Cost</h3>
              <p className="text-sm text-gray-600">Free to list and free to search. No credit card required.</p>
            </div>
          </div>
        </div>

        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-4">
          <p>
            Whether you run a small shop in Lahore, a clinic in Karachi, or a restaurant in Islamabad, you can{" "}
            <Link href="/add" className="text-primary font-medium hover:underline">
              add your business free
            </Link>{" "}
            and reach more customers. Our directory helps people find local businesses by city and category, read
            reviews, and get contact details in one place.
          </p>
          <p>
            We cover major cities including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, and
            Quetta, as well as many smaller towns. Browse by{" "}
            <Link href="/category" className="text-primary font-medium hover:underline">
              business categories in Pakistan
            </Link>{" "}
            or use the search bar to find a specific business or service. Each listing shows the business name,
            category, city, phone number, and other details when available.
          </p>
          <p>
            We are committed to supporting both businesses and consumers in Pakistan. Our goal is to become a trusted
            place where people find local services and where businesses get more visibility at no cost. Explore our{" "}
            <Link href="/category" className="text-primary font-medium hover:underline">
              categories
            </Link>
            , or{" "}
            <Link href="/add" className="text-primary font-medium hover:underline">
              add your business free
            </Link>{" "}
            to get started. For questions, visit our{" "}
            <Link href="/contact" className="text-primary font-medium hover:underline">
              contact page
            </Link>{" "}
            or read our{" "}
            <Link href="/about" className="text-primary font-medium hover:underline">
              about page
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
