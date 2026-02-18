"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Shows a compact banner when the user is offline so they get a clear message
 * instead of broken screens. Hides when back online.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOffline(!navigator.onLine);
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-800 text-white px-4 py-3 flex items-center justify-center gap-2 text-sm shadow-lg border-t border-slate-700 md:pb-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <WifiOff className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
      <span>You're offline. Some content may be unavailable.</span>
    </div>
  );
}
