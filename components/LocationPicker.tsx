"use client";

import dynamic from "next/dynamic";

// Dynamically import LocationPicker with SSR disabled
// This avoids "window is not defined" error during SSR
const LocationPickerClient = dynamic(
  () => import("./LocationPickerClient"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center">
        <span className="text-slate-400">Memuat peta...</span>
      </div>
    ),
  }
);

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
}

export default function LocationPicker(props: LocationPickerProps) {
  return <LocationPickerClient {...props} />;
}
