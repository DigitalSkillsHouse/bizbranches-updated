import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Reusable slug for URLs (categories, cities, etc.) */
export const slugify = (s: string): string =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

/** Truncate text to length with ellipsis */
export const truncate = (text: string, maxLen: number): string =>
  text.length <= maxLen ? text : `${text.slice(0, maxLen - 3).trim()}...`

/** Single source for business logo URL (Cloudinary or placeholder). Reused by all listing cards. */
export const getBusinessLogoUrl = (
  logo?: string | null,
  size: "thumb" | "medium" | "large" = "thumb"
): string => {
  const raw = logo ?? ""
  if (!raw) return "/placeholder.svg"
  if (/^https?:\/\//i.test(raw)) return raw
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) return "/placeholder.svg"
  const cleanId = String(raw)
    .replace(/\.[^/.]+$/, "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/") || ""
  if (!cleanId) return "/placeholder.svg"
  const dim = size === "thumb" ? "200" : size === "medium" ? "400" : "600"
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fit,w_${dim},h_${dim},q_auto,f_auto/${cleanId}`
}