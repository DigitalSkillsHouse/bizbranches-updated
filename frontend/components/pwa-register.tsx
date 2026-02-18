"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker. Runs only in the browser and in production
 * so dev server updates are not cached.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }, []);
  return null;
}
