"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  jobLat: number;
  jobLng: number;
  workerLat: number;
  workerLng: number;
  radius: number;
  jobAddress: string;
}

// Validate coordinates
function isValidCoord(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    lat !== 0 &&
    lng !== 0
  );
}

// Custom icons
const createJobIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: #EF4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

const createWorkerIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: #3B82F6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }
      </style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Calculate bearing/direction
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = (((θ * 180) / Math.PI) + 360) % 360;

  const directions = [
    "Utara",
    "Utara Timur",
    "Timur",
    "Selatan Timur",
    "Selatan",
    "Selatan Barat",
    "Barat",
    "Utara Barat",
  ];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

export default function LocationMap({
  jobLat,
  jobLng,
  workerLat,
  workerLng,
  radius,
  jobAddress,
}: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [direction, setDirection] = useState<string | null>(null);
  const [hasValidCoords, setHasValidCoords] = useState(true);

  useEffect(() => {
    // Validate coordinates
    const jobValid = isValidCoord(jobLat, jobLng);
    const workerValid = isValidCoord(workerLat, workerLng);

    if (!jobValid || !workerValid) {
      setHasValidCoords(false);
      setDistance(null);
      setDirection(null);
      return;
    }

    setHasValidCoords(true);

    if (!mapContainerRef.current || mapRef.current) return;

    // Calculate center point - validate before creating map
    const midLat = (workerLat + jobLat) / 2;
    const midLng = (workerLng + jobLng) / 2;

    // Additional validation for computed center
    if (!isValidCoord(midLat, midLng)) {
      console.error("Invalid computed center coordinates:", { midLat, midLng, jobLat, jobLng, workerLat, workerLng });
      return;
    }

    // Calculate distance and direction
    const dist = calculateDistance(workerLat, workerLng, jobLat, jobLng);
    const dir = calculateBearing(workerLat, workerLng, jobLat, jobLng);
    setDistance(dist);
    setDirection(dir);

    const map = L.map(mapContainerRef.current, {
      center: [midLat, midLng],
      zoom: 15,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add geofence circle (job location)
    L.circle([jobLat, jobLng], {
      radius: radius,
      color: "#EF4444",
      fillColor: "#FEE2E2",
      fillOpacity: 0.3,
      weight: 2,
      dashArray: "5, 5",
    }).addTo(map);

    // Add job marker
    L.marker([jobLat, jobLng], {
      icon: createJobIcon(),
    })
      .addTo(map)
      .bindPopup(`<b>Lokasi Job</b><br/>${jobAddress}`);

    // Add worker marker
    L.marker([workerLat, workerLng], {
      icon: createWorkerIcon(),
    })
      .addTo(map)
      .bindPopup("<b>Lokasi Anda</b>");

    // Draw line between points
    L.polyline(
      [
        [workerLat, workerLng],
        [jobLat, jobLng],
      ],
      {
        color: "#94A3B8",
        weight: 2,
        dashArray: "5, 10",
      }
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [jobLat, jobLng, workerLat, workerLng, radius, jobAddress]);

  const isInsideRadius = distance !== null && distance <= radius;

  // Show fallback if coordinates are invalid
  if (!hasValidCoords) {
    return (
      <div className="space-y-3">
        <div className="w-full h-64 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-center p-4">
          <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <p className="text-slate-500 font-medium">Lokasi tidak tersedia</p>
          <p className="text-slate-400 text-sm mt-1">Koordinat GPS belum diset untuk job ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Map */}
      <div
        ref={mapContainerRef}
        className="w-full h-64 rounded-xl overflow-hidden"
        style={{ zIndex: 1 }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-slate-600">Lokasi Job</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-600">Posisi Anda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full"
            style={{
              background: "transparent",
              border: "2px dashed #EF4444",
            }}
          />
          <span className="text-slate-600">Radius {radius}m</span>
        </div>
      </div>

      {/* Distance Info */}
      {distance !== null && (
        <div
          className={`rounded-xl p-4 text-center ${
            isInsideRadius ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg
              className={`w-5 h-5 ${isInsideRadius ? "text-green-600" : "text-amber-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              {isInsideRadius ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              )}
            </svg>
            <span
              className={`text-lg font-bold ${
                isInsideRadius ? "text-green-700" : "text-amber-700"
              }`}
            >
              {distance < 1000
                ? `${Math.round(distance)} meter`
                : `${(distance / 1000).toFixed(1)} km`}
            </span>
          </div>
          <p
            className={`text-sm ${
              isInsideRadius ? "text-green-600" : "text-amber-600"
            }`}
          >
            {isInsideRadius
              ? "Anda berada di dalam area kerja"
              : `Arah: ${direction} dari lokasi job`}
          </p>
          {!isInsideRadius && (
            <p className="text-xs text-amber-500 mt-1">
              Bergerak menuju area merah untuk check-in
            </p>
          )}
        </div>
      )}
    </div>
  );
}
