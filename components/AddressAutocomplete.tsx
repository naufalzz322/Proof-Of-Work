"use client";

import { useState, useRef, useEffect } from "react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance?: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onLocationChange: (lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Format distance for display
function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onLocationChange,
  placeholder = "Ketik alamat...",
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user's current location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      setLocationStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationStatus("success");
        },
        () => {
          setLocationStatus("error");
        },
        { timeout: 5000, maximumAge: 300000 } // 5s timeout, 5min cache
      );
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search with location prioritization
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=10&addressdetails=1`;

        // Add viewbox to prioritize results near user's location
        if (userLocation) {
          // viewbox format: left,bottom,right,top (degrees)
          // Create a bounding box of ~50km around user location
          const radius = 0.5; // ~50km
          const viewbox = `${userLocation.lng - radius},${userLocation.lat - radius},${userLocation.lng + radius},${userLocation.lat + radius}`;
          url += `&viewbox=${viewbox}&bounded=0`;
        }

        const res = await fetch(url, {
          headers: {
            "Accept": "application/json",
          },
        });

        if (res.ok) {
          let data: NominatimResult[] = await res.json();

          // Sort by distance from user if location available
          if (userLocation && data.length > 0) {
            data = data
              .map((item) => ({
                ...item,
                _distance: calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  parseFloat(item.lat),
                  parseFloat(item.lon)
                ),
              }))
              .sort((a, b) => (a._distance || 0) - (b._distance || 0))
              .slice(0, 5) // Take top 5 closest
              .map(({ _distance, ...rest }) => rest); // Remove distance from final object
          }

          setSuggestions(data);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setSuggestions([]);
      }
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, userLocation]);

  function handleSelect(suggestion: NominatimResult) {
    onChange(suggestion.display_name);
    onLocationChange(parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  // Calculate distance for a suggestion
  function getDistanceToSuggestion(suggestion: NominatimResult): number | null {
    if (!userLocation) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon)
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 pr-10"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" />
          </div>
        )}
        {/* Location indicator */}
        {locationStatus === "success" && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1" title="Mencari alamat terdekat dari lokasi Anda">
            <svg className="w-4 h-4" style={{ color: "#16A34A" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[60] w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {/* Header with location info */}
          {userLocation && (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <svg className="w-3.5 h-3.5" style={{ color: "#16A34A" }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-xs" style={{ color: "#64748B" }}>
                Terdekat dari lokasi Anda
              </span>
            </div>
          )}
          {suggestions.map((suggestion, index) => {
            const distance = getDistanceToSuggestion(suggestion);
            return (
              <button
                key={suggestion.place_id}
                onClick={() => handleSelect(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                  index === selectedIndex ? "bg-amber-50" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: distance !== null ? "#16A34A" : "#94A3B8" }}
                    fill={distance !== null ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    strokeWidth={distance !== null ? 0 : 1.5}
                    stroke="currentColor"
                  >
                    {distance !== null ? (
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </>
                    )}
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{suggestion.display_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {distance !== null && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                          {formatDistance(distance)}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "#94A3B8" }}>
                        {suggestion.lat.slice(0, 9)}, {suggestion.lon.slice(0, 9)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
