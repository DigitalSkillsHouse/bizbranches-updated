"use client"

import { useEffect } from "react"

/**
 * Soft content-protection deterrents. By default OFF so right-click and DevTools work.
 * Set NEXT_PUBLIC_ENABLE_COPY_DETERRENT=true to block right-click / F12 / Ctrl+U.
 */
const ENABLED = process.env.NEXT_PUBLIC_ENABLE_COPY_DETERRENT === "true"

export function CopyDeterrent() {
  useEffect(() => {
    if (!ENABLED) return

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
