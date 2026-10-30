"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Sends one anonymous page-view beacon per public page visited (no cookies).
// Admin pages are never counted.
export default function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const body = JSON.stringify({ path: pathname });
    try {
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
      }
    } catch {
      // counting is best effort
    }
  }, [pathname]);
  return null;
}
