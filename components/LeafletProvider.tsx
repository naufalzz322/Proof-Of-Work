"use client";

import { useEffect } from "react";

export default function LeafletProvider() {
  useEffect(() => {
    // Dynamically import Leaflet only on client side
    // This avoids "window is not defined" error during SSR
    import("leaflet").then((L) => {
      // Fix Leaflet default marker icons in Next.js
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    });
  }, []);

  return null;
}
