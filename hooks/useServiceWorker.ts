"use client";

import { useEffect } from "react";

/**
 * Hook to register and manage the service worker
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SW] Registered successfully:", registration.scope);

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log("[SW] New version available");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("[SW] Registration failed:", error);
        });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_STARTED") {
          console.log("[SW] Background sync started:", event.data.tag);
        }
      });
    }
  }, []);
}
