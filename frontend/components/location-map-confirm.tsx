"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, MapPin } from "lucide-react"

interface LocationMapConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialLat: number
  initialLng: number
  onConfirm: (lat: number, lng: number) => void
  address?: string
}

export function LocationMapConfirm({
  open,
  onOpenChange,
  initialLat,
  initialLng,
  onConfirm,
  address,
}: LocationMapConfirmProps) {
  const [lat, setLat] = useState(initialLat)
  const [lng, setLng] = useState(initialLng)
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    center: [number, number]
    zoom: number
    onMarkerMove: (lat: number, lng: number) => void
  }> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLat(initialLat)
    setLng(initialLng)
  }, [initialLat, initialLng])

  useEffect(() => {
    if (!open) return
    import("./location-map-inner").then((mod) => {
      setMapComponent(() => mod.LocationMapInner)
      setLoading(false)
    })
  }, [open])

  const handleConfirm = useCallback(() => {
    onConfirm(lat, lng)
    onOpenChange(false)
  }, [lat, lng, onConfirm, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Is this location correct?
          </DialogTitle>
          <DialogDescription>
            We detected this from your address. Drag the pin to adjust, then confirm.
            {address && (
              <span className="mt-2 block text-sm text-muted-foreground">{address}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-[280px] w-full rounded-lg border bg-muted overflow-hidden">
          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : MapComponent ? (
            <MapComponent
              center={[lat, lng]}
              zoom={15}
              onMarkerMove={(newLat, newLng) => {
                setLat(newLat)
                setLng(newLng)
              }}
            />
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button onClick={handleConfirm}>
            Yes, this is correct
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
