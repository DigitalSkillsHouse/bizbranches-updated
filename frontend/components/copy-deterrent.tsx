"use client"

import { useEffect } from "react"

/**
 * Soft content-protection deterrents. These do NOT fully prevent:
 * - DevTools (F12 / Inspect) — browsers do not allow sites to block these.
 * - View Source — users can use curl, cache, or disable JS.
 * - Copying — users can screenshot or type manually.
 * They only make casual right-click copy/save and selection harder.
 * May affect accessibility (e.g. copying contact info); use with care.
 */
export function CopyDeterrent() {
  useEffect(() => {
    const body = document.body

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const preventShortcuts = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault()
        return false
      }
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
        e.preventDefault()
        return false
      }
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault()
        return false
      }
    }

    const preventDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target?.tagName === "IMG" || target?.closest?.("picture")) {
        e.preventDefault()
      }
    }

    body.classList.add("content-protection")
    document.addEventListener("contextmenu", preventContextMenu)
    document.addEventListener("keydown", preventShortcuts, { capture: true })
    document.addEventListener("dragstart", preventDrag, { passive: false })

    return () => {
      body.classList.remove("content-protection")
      document.removeEventListener("contextmenu", preventContextMenu)
      document.removeEventListener("keydown", preventShortcuts, { capture: true })
      document.removeEventListener("dragstart", preventDrag)
    }
  }, [])

  return null
}
