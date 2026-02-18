"use client"

import { useEffect, useRef } from "react"

const AD_CLIENT = "ca-pub-4083132987699578"
const AD_SLOT = "3877186043"

interface AdSenseSlotProps {
  /** Unique id for this ad placement */
  slotId: string
  /** Optional: different ad slot from AdSense dashboard */
  adSlot?: string
  /** Additional className for container */
  className?: string
  /** Show only in production */
  productionOnly?: boolean
}

export function AdSenseSlot({
  slotId,
  adSlot = AD_SLOT,
  className = "",
  productionOnly = true,
}: AdSenseSlotProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const pushedRef = useRef(false)

  useEffect(() => {
    if (productionOnly && process.env.NODE_ENV !== "production") return
    if (pushedRef.current || !adRef.current) return

    const initAd = () => {
      try {
        // @ts-expect-error AdSense global
        if (typeof window !== "undefined" && window.adsbygoogle && adRef.current) {
          // @ts-expect-error AdSense global
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
          pushedRef.current = true
        }
      } catch {
        // Ad blocker or script not loaded - fail silently
      }
    }

    initAd()
    const t = setTimeout(initAd, 150)
    return () => clearTimeout(t)
  }, [productionOnly])

  if (productionOnly && process.env.NODE_ENV !== "production") {
    return (
      <div className={`flex items-center justify-center min-h-[90px] bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <span className="text-xs text-gray-500">Ad slot: {slotId}</span>
      </div>
    )
  }

  return (
    <div
      ref={adRef}
      role="complementary"
      aria-label="Advertisement"
      className={`min-h-[90px] overflow-hidden my-6 sm:my-8 ${className}`}
      suppressHydrationWarning
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        suppressHydrationWarning
      />
    </div>
  )
}
