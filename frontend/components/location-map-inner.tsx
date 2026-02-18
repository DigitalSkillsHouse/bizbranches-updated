"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const DEFAULT_ICON = typeof window !== "undefined"
  ? L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    })
  : null

interface LocationMapInnerProps {
  center: [number, number]
  zoom: number
  onMarkerMove: (lat: number, lng: number) => void
}

export function LocationMapInner({ center, zoom, onMarkerMove }: LocationMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    const map = L.map(containerRef.current).setView(center, zoom)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map)
    const marker = L.marker(center, { draggable: true })
    if (DEFAULT_ICON) marker.setIcon(DEFAULT_ICON)
    marker.addTo(map)
    marker.on("dragend", () => {
      const pos = marker.getLatLng()
      onMarkerMove(pos.lat, pos.lng)
    })
    mapRef.current = map
    markerRef.current = marker
    setMounted(true)
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mounted || !markerRef.current) return
    markerRef.current.setLatLng(center)
    mapRef.current?.setView(center, zoom)
  }, [mounted, center[0], center[1], zoom])

  return <div ref={containerRef} className="h-full min-h-[280px] w-full" />
}
