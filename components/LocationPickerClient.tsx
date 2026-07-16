"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}

// Custom marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #D97706;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

export default function LocationPickerClient({
  lat,
  lng,
  onLocationChange,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default to Indonesia center if no coords
    const initialLat = lat ?? -6.2088;
    const initialLng = lng ?? 106.8456;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: lat && lng ? 16 : 5,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add marker if coords exist
    if (lat && lng) {
      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(),
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });
    }

    // Click to set location
    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        const marker = L.marker([clickLat, clickLng], {
          icon: createMarkerIcon(),
          draggable: true,
        }).addTo(map);
        markerRef.current = marker;

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChange(pos.lat, pos.lng);
        });
      }

      onLocationChange(clickLat, clickLng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker when props change
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    mapRef.current.setView([lat, lng], 16);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(),
        draggable: true,
      }).addTo(mapRef.current);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });
    }
  }, [lat, lng, onLocationChange]);

  return (
    <div className="space-y-2">
      <div
        ref={mapContainerRef}
        className="w-full h-48 rounded-xl border border-slate-300 overflow-hidden"
        style={{ zIndex: 1 }}
      />
      <p className="text-xs text-center" style={{ color: "#94A3B8" }}>
        Klik pada peta untuk memilih lokasi, atau seret marker untuk menyesuaikan
      </p>
    </div>
  );
}
