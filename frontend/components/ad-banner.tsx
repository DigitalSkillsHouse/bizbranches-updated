"use client"

import { AdSenseSlot } from "@/components/adsense-slot"

interface AdBannerProps {
  placement: "header" | "sticky-footer"
}

export function AdBanner({ placement }: AdBannerProps) {
  if (placement === "header") {
    return (
      <div className="w-full px-4 py-2 sm:py-3 bg-background/80 border-b border-border/50" role="complementary" aria-label="Advertisement">
        <div className="container mx-auto max-w-4xl min-h-[90px]">
          <AdSenseSlot slotId="global-header-ad" className="my-0" />
        </div>
      </div>
    )
  }

  if (placement === "sticky-footer") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb" role="complementary" aria-label="Advertisement">
        <div className="container mx-auto max-w-4xl px-4 py-3 min-h-[90px]">
          <AdSenseSlot slotId="sticky-footer-ad" className="max-h-[100px] my-0" />
        </div>
      </div>
    )
  }

  return null
}
