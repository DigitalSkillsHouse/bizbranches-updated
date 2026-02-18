"use client"

import { AdSenseSlot } from "@/components/adsense-slot"
import { cn } from "@/lib/utils"

/** Reusable ad container: consistent padding, AdSense-safe (not near card click areas). */
export function AdSection({
  slotId,
  className = "",
}: {
  slotId: string
  className?: string
}) {
  return (
    <div className={cn("my-8 sm:my-10 py-4", className)} role="complementary" aria-label="Advertisement">
      <AdSenseSlot slotId={slotId} className="my-0" />
    </div>
  )
}
