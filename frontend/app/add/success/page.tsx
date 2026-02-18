"use client"

/**
 * Success page ad placements — use separate AdSense units for better revenue.
 * In AdSense: create 3 ad units and set these env vars (numeric slot IDs):
 *
 *   NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_ABOVE_FOLD  — Responsive display (above the fold)
 *   NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_IN_CONTENT  — Responsive or In-article (between content)
 *   NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_FOOTER      — Responsive display (footer)
 *
 * Recommended types: Responsive for all three (works with current component).
 * Optional: create the middle one as "In-article" in AdSense for a more native look.
 */
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ExternalLink, PlusCircle, Home, Building2 } from "lucide-react"
import { AdSenseSlot } from "@/components/adsense-slot"
import { SITE_NAME } from "@/lib/site"
import { Suspense } from "react"

function getSuccessAdSlots() {
  return {
    aboveFold: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_ABOVE_FOLD || undefined,
    inContent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_IN_CONTENT || undefined,
    footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SUCCESS_FOOTER || undefined,
  }
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get("slug")?.trim() || null
  const name = searchParams.get("name")?.trim() || "Your business"
  const adSlots = getSuccessAdSlots()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-2xl">
        {/* Success message — above the fold */}
        <section className="text-center mb-6 sm:mb-8" aria-live="polite">
          <div className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-emerald-100 ring-4 ring-emerald-200/60 mb-6" aria-hidden>
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Listing submitted successfully
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Your business is now live on {SITE_NAME}. Customers can find and contact you right away.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live now
          </div>
        </section>

        {/* Ad placement 1 — above the fold, non-blocking */}
        <div className="my-6 sm:my-8" role="complementary" aria-label="Advertisement">
          <div className="min-h-[90px] w-full" data-ad-placement="success-above-fold">
            <AdSenseSlot slotId="add-success-above-fold" adSlot={adSlots.aboveFold} className="my-0" />
          </div>
        </div>

        {/* Listing preview card */}
        {slug && (
          <section className="mb-6 sm:mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" aria-hidden />
              Your listing
            </h2>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <p className="font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-sm text-gray-500 mt-0.5">Now visible on the directory</p>
              <Button asChild className="mt-4 w-full sm:w-auto min-h-[44px] bg-emerald-600 hover:bg-emerald-700">
                <Link href={`/${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  View your listing
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* Ad placement 2 — in-content */}
        <div className="my-6 sm:my-8" role="complementary" aria-label="Advertisement">
          <div className="min-h-[90px] w-full" data-ad-placement="success-in-content">
            <AdSenseSlot slotId="add-success-in-content" adSlot={adSlots.inContent} className="my-0" />
          </div>
        </div>

        {/* Next steps */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">What you can do next</h2>
          <ul className="space-y-3">
            <li>
              <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 rounded-xl" size="lg">
                <Link href={slug ? `/${encodeURIComponent(slug)}` : "/search"}>
                  <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
                  {slug ? "View and share your listing" : "Browse the directory"}
                </Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 rounded-xl" size="lg">
                <Link href="/add">
                  <PlusCircle className="h-5 w-5 shrink-0" aria-hidden />
                  Add another business
                </Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 rounded-xl" size="lg">
                <Link href="/">
                  <Home className="h-5 w-5 shrink-0" aria-hidden />
                  Return to home
                </Link>
              </Button>
            </li>
          </ul>
        </section>

        {/* Ad placement 3 — bottom, mobile-optimized */}
        <div className="my-6 sm:my-8" role="complementary" aria-label="Advertisement">
          <div className="min-h-[90px] w-full" data-ad-placement="success-footer">
            <AdSenseSlot slotId="add-success-footer" adSlot={adSlots.footer} className="my-0" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
