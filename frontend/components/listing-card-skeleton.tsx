import { cn } from "@/lib/utils"

type SkeletonVariant = "compact" | "card" | "mini"

interface ListingCardSkeletonProps {
  variant?: SkeletonVariant
  className?: string
}

/** Reusable skeleton for listing cards. Prevents layout shift during load. */
export function ListingCardSkeleton({ variant = "compact", className }: ListingCardSkeletonProps) {
  const base = "animate-pulse rounded-xl bg-gray-100"

  if (variant === "compact") {
    return (
      <div className={cn("rounded-xl border border-gray-200 bg-white p-5 sm:p-6 min-h-[140px]", className)}>
        <div className="flex items-start gap-4 sm:gap-6">
          <div className={cn(base, "w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0")} />
          <div className="flex-1 min-w-0 space-y-2">
            <div className={cn(base, "h-5 w-3/4")} />
            <div className={cn(base, "h-4 w-1/2")} />
            <div className={cn(base, "h-4 w-full")} />
          </div>
        </div>
      </div>
    )
  }

  if (variant === "mini") {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-gray-200", className)}>
        <div className={cn(base, "h-32 w-full")} />
        <div className="p-3 sm:p-4 space-y-2">
          <div className={cn(base, "h-4 w-2/3")} />
          <div className={cn(base, "h-3 w-1/3")} />
          <div className={cn(base, "h-3 w-1/2")} />
        </div>
      </div>
    )
  }

  // card
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-5 sm:p-6 min-h-[280px] flex flex-col", className)}>
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <div className={cn(base, "w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0")} />
        <div className="flex-1 space-y-2">
          <div className={cn(base, "h-4 w-3/4")} />
          <div className={cn(base, "h-3 w-1/2")} />
        </div>
      </div>
      <div className={cn(base, "h-16 flex-1 w-full")} />
      <div className={cn(base, "h-10 w-full mt-4 rounded-lg")} />
    </div>
  )
}
