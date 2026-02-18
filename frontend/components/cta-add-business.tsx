"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const ADD_HREF = "/add"
const LINK_CLASS =
  "flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
const ARIA_LABEL = "Add your business free"

/** Single CTA component: inline, block, or sticky (mobile bar). Reused everywhere. */
export function CtaAddBusiness({
  variant = "block",
  className = "",
}: {
  variant?: "inline" | "block" | "sticky"
  className?: string
}) {
  const link = (
    <Link href={ADD_HREF} className={variant === "sticky" ? `${LINK_CLASS} w-full` : LINK_CLASS} aria-label={ARIA_LABEL}>
      <Plus className="h-5 w-5" aria-hidden />
      <span>Add Your Business Free</span>
    </Link>
  )

  if (variant === "inline") {
    return (
      <p className={cn("text-center text-sm sm:text-base text-gray-600", className)}>
        List your business for free.{" "}
        <Link
          href={ADD_HREF}
          className="font-semibold text-primary hover:text-primary/90 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          aria-label={ARIA_LABEL}
        >
          Add Your Business Free
        </Link>
      </p>
    )
  }

  if (variant === "sticky") {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden safe-area-pb"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
        role="complementary"
        aria-label="Add your business"
      >
        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3">
          {link}
        </div>
      </div>
    )
  }

  return (
    <section
      className={cn("rounded-xl border border-border bg-muted/50 p-6 sm:p-8", className)}
      aria-label="Add your business"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">List your business for free</h3>
          <p className="text-sm sm:text-base text-gray-600">Get found by customers across Pakistan. Free listing, no hidden fees.</p>
        </div>
        {link}
      </div>
    </section>
  )
}
