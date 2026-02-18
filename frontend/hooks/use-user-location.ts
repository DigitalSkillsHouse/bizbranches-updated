"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "biz:userLocation"
const TTL_MS = 30 * 60 * 1000

export interface UserLocation {
  lat: number
  lng: number
  source: "browser" | "ip"
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resolve = useCallback(() => {
    setLoading(true)
    setError(null)
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { lat: number; lng: number; source: string; ts: number }
        if (parsed.ts && Date.now() - parsed.ts < TTL_MS && Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
          setLocation({ lat: parsed.lat, lng: parsed.lng, source: (parsed.source as "browser" | "ip") || "ip" })
          setLoading(false)
          return
        }
      }
    } catch {}

    if (!navigator?.geolocation) {
      fetchIpLocation(setLocation, setError, setLoading)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const next: UserLocation = { lat, lng, source: "browser" }
        setLocation(next)
        setError(null)
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, ts: Date.now() }))
        } catch {}
        setLoading(false)
      },
      () => {
        fetchIpLocation(setLocation, setError, setLoading)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }, [])

  useEffect(() => {
    resolve()
  }, [resolve])

  return { location, loading, error, retry: resolve }
}

async function fetchIpLocation(
  setLocation: (l: UserLocation | null) => void,
  setError: (e: string | null) => void,
  setLoading: (v: boolean) => void
) {
  try {
    const res = await fetch("/api/geo", { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    if (data?.lat != null && data?.lng != null) {
      const next: UserLocation = { lat: data.lat, lng: data.lng, source: "ip" }
      setLocation(next)
      setError(null)
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, ts: Date.now() }))
      } catch {}
    } else {
      setLocation(null)
      setError("Location unavailable")
    }
  } catch {
    setLocation(null)
    setError("Location unavailable")
  } finally {
    setLoading(false)
  }
}

/** Strip "near me" / "nearby" from query and return { nearMe: boolean, searchTerm: string } */
export function parseNearMeQuery(q: string): { nearMe: boolean; searchTerm: string } {
  const trimmed = (q || "").trim()
  const nearMe = /\b(near\s*me|nearby)\b/i.test(trimmed)
  const searchTerm = trimmed.replace(/\b(near\s*me|nearby)\b/gi, "").trim()
  return { nearMe, searchTerm: searchTerm || trimmed }
}
