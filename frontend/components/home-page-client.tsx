"use client";

import dynamic from "next/dynamic";
import { HeroSection } from "@/components/hero-section";
import { TopListingsSection } from "@/components/top-listings-section";
import { SEOIntroSection } from "@/components/seo-intro-section";
import { AdSenseSlot } from "@/components/adsense-slot";

const CategoriesSection = dynamic(
  () => import("@/components/categories-section").then((m) => ({ default: m.CategoriesSection })),
  {
    loading: () => <CategoriesSectionSkeleton />,
    ssr: true,
  }
);

const TopCitiesSection = dynamic(
  () => import("@/components/top-cities-section").then((m) => ({ default: m.TopCitiesSection })),
  {
    loading: () => <SectionSkeleton lines={3} />,
    ssr: true,
  }
);

const HowItWorksSection = dynamic(
  () => import("@/components/how-it-works-section").then((m) => ({ default: m.HowItWorksSection })),
  {
    loading: () => <SectionSkeleton lines={4} />,
    ssr: true,
  }
);

const FAQSection = dynamic(
  () => import("@/components/faq-section").then((m) => ({ default: m.FAQSection })),
  {
    loading: () => <SectionSkeleton lines={2} />,
    ssr: true,
  }
);

function CategoriesSectionSkeleton() {
  return (
    <section className="py-12 bg-gradient-to-b from-white via-gray-50/30 to-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="h-10 w-64 bg-gray-200 rounded mx-auto mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white shadow overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse" />
              <div className="p-5">
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="py-12 animate-pulse">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6" />
        {[...Array(lines)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded w-full mb-3" />
        ))}
      </div>
    </div>
  );
}

type HomePageClientProps = {
  initialCategories?: any[];
  initialRecent?: any[];
};

export function HomePageClient({ initialCategories = [], initialRecent = [] }: HomePageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <HeroSection />
        <TopListingsSection initialRecent={initialRecent} />
        <SEOIntroSection />

        <div className="w-full px-4 py-4 sm:py-6 max-w-4xl mx-auto">
          <AdSenseSlot slotId="home-center-ad" />
        </div>

        <CategoriesSection initialCategories={initialCategories} />
        <TopCitiesSection />
        <HowItWorksSection />
        <FAQSection />
      </main>

      <div className="w-full px-4 py-4 sm:py-6 max-w-4xl mx-auto">
        <AdSenseSlot slotId="home-footer-ad" />
      </div>
    </div>
  );
}
