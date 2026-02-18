/** Shared business shape for listing cards and pages. All fields optional except id/name/category. */
export interface ListingBusiness {
  id: string
  slug?: string
  name: string
  category: string
  city?: string
  address?: string
  phone?: string
  email?: string
  description?: string
  logo?: string | null
  logoUrl?: string | null
  image?: string | null
  status?: "pending" | "approved" | "rejected"
  distanceKm?: number
}

export type ListingCardVariant = "compact" | "card" | "mini"
