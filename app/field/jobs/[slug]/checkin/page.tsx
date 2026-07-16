"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { isWithinGeofence } from "@/lib/geofence";
import dynamic from "next/dynamic";

// Dynamic import for map (client-side only)
const LocationMap = dynamic(() => import("@/components/field/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-slate-400">Memuat peta...</span>
    </div>
  ),
});

interface Job {
  id: string;
  slug: string;
  locationLat: string | number;
  locationLng: string | number;
  locationRadius: number;
  locationAddress: string;
  scheduledTime: string;
}

// User-friendly error messages
function getLocationErrorMessage(code: number | undefined): string {
  switch (code) {
    case 1:
      return "Izin lokasi ditolak. Silakan aktifkan lokasi di pengaturan browser dan izinkan akses.";
    case 2:
      return "Lokasi tidak dapat ditemukan. Pastikan GPS aktif dan coba lagi.";
    case 3:
      return "Waktu pencarian lokasi habis. Silakan coba lagi.";
    default:
      return "Terjadi kesalahan saat mendapatkan lokasi. Silakan coba lagi.";
  }
}

// Calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate late minutes
function calculateLateMinutes(scheduledTime: string, currentTime: Date): number {
  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const scheduledDate = new Date(currentTime);
  scheduledDate.setHours(hours, minutes, 0, 0);
  const diff = currentTime.getTime() - scheduledDate.getTime();
  return Math.max(0, Math.round(diff / 60000));
}

// Validate coordinates for map display
function isValidCoordinatePair(lat1: number, lng1: number, lat2: number, lng2: number): boolean {
  const isValidCoord = (lat: number, lng: number) => {
    if (isNaN(lat) || isNaN(lng)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    if (lat === 0 && lng === 0) return false;
    return true;
  };
  return isValidCoord(lat1, lng1) && isValidCoord(lat2, lng2);
}

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "fetching_job" | "getting_location" | "success" | "out_of_range" | "error">("loading");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [jobLocation, setJobLocation] = useState<{ lat: number; lng: number; radius: number; address: string } | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lateMinutes, setLateMinutes] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchJobLocation = useCallback(async () => {
    if (!jobId) return;
    setStatus("getting_location");
    try {
      const res = await fetch(`/api/jobs/${jobId}/location`);
      if (!res.ok) throw new Error("Failed to fetch job");
      const data = await res.json();
      setJobLocation({
        lat: Number(data.locationLat ?? 0),
        lng: Number(data.locationLng ?? 0),
        radius: data.locationRadius ?? 200,
        address: data.locationAddress ?? "",
      });
    } catch {
      setError("Tidak dapat memuat data lokasi job. Silakan coba lagi.");
      setStatus("error");
    }
  }, [jobId]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung fitur lokasi. Gunakan browser lain seperti Chrome atau Safari.");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(userLoc);
        // Log accuracy for debugging
        console.log("Location accuracy:", pos.coords.accuracy, "meters");
        await fetchJobLocation();
      },
      (err) => {
        const message = getLocationErrorMessage(err.code);
        setError(message);
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchJobLocation]);

  useEffect(() => {
    if (!slug) return;
    setStatus("fetching_job");
    fetch(`/api/jobs/slug/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setStatus("error");
        } else {
          setJob(data);
          setJobId(data.id);
          setJobLocation({
            lat: Number(data.locationLat ?? 0),
            lng: Number(data.locationLng ?? 0),
            radius: data.locationRadius ?? 200,
            address: data.locationAddress ?? "",
          });
        }
      })
      .catch(() => {
        setError("Tidak dapat memuat data job. Silakan coba lagi.");
        setStatus("error");
      });
  }, [slug]);

  // Update current time every second for late calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (jobLocation && !position) {
      getLocation();
    }
  }, [jobLocation, getLocation, position]);

  useEffect(() => {
    if (position && jobLocation) {
      const hasValidJobCoords = jobLocation.lat !== 0 && jobLocation.lng !== 0;

      if (!hasValidJobCoords) {
        setStatus("success");
        return;
      }

      // Calculate late minutes
      if (job?.scheduledTime) {
        const late = calculateLateMinutes(job.scheduledTime, currentTime);
        setLateMinutes(late);
      }

      // Calculate distance
      const dist = calculateDistance(position.lat, position.lng, jobLocation.lat, jobLocation.lng);
      setDistance(dist);

      const inRange = dist <= jobLocation.radius;
      setStatus(inRange ? "success" : "out_of_range");
    }
  }, [position, jobLocation, job, currentTime]);

  async function handleCheckIn(override = false) {
    if (!position || !jobLocation || !jobId) return;
    setSubmitting(true);

    const res = await fetch(`/api/jobs/${jobId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: position.lat,
        lng: position.lng,
        isOverride: override,
        overrideReason: override ? overrideReason : undefined,
      }),
    });

    if (res.ok) {
      router.push(`/field/jobs/${slug}/areas`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Check-in gagal. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  const formattedTime = position
    ? new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  if (status === "loading" || status === "fetching_job") {
    return (
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">Memuat data...</p>
          <p className="text-sm text-slate-400 mt-1">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Check-in GPS</h1>
        <div className="bg-white rounded-2xl border border-red-200 p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-center text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            Coba Lagi
          </button>
          <p className="text-center text-xs text-slate-400 mt-4">
            Jika masalah terus berlanjut, hubungi supervisor Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold text-slate-900 mb-1">Check-in GPS</h1>
      <p className="text-sm text-slate-500 mb-6">Verifikasi kehadiran di lokasi kerja</p>

      {status === "getting_location" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">Mendeteksi lokasi...</p>
          <p className="text-sm text-slate-400 mt-1">Pastikan GPS aktif dan izinkan akses lokasi</p>
        </div>
      )}

      {status === "success" && jobLocation && position && (
        <div className="space-y-4">
          {lateMinutes > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-amber-800 font-semibold">Kamu Terlambat</p>
                  <p className="text-amber-700 text-sm mt-0.5">
                    Terlambat {lateMinutes} menit dari jadwal ({job?.scheduledTime})
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-green-800 font-bold text-base">Lokasi Terverifikasi</p>
            <p className="text-green-600 text-sm mt-1">{jobLocation.address}</p>
            <p className="text-green-700 text-sm mt-0.5 flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formattedTime}
            </p>
          </div>

          {/* Map showing both locations - only render with valid coordinates */}
          {isValidCoordinatePair(jobLocation.lat, jobLocation.lng, position.lat, position.lng) && (
            <LocationMap
              jobLat={jobLocation.lat}
              jobLng={jobLocation.lng}
              workerLat={position.lat}
              workerLng={position.lng}
              radius={jobLocation.radius}
              jobAddress={jobLocation.address}
            />
          )}

          {!isValidCoordinatePair(jobLocation.lat, jobLocation.lng, position.lat, position.lng) && (
            <div className="w-full h-64 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-center p-4">
              <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <p className="text-slate-500 font-medium">Lokasi tidak tersedia</p>
              <p className="text-slate-400 text-sm mt-1">Tidak dapat menampilkan peta</p>
            </div>
          )}

          <button
            onClick={() => handleCheckIn(false)}
            disabled={submitting}
            className="w-full py-4 bg-green-600 text-white font-bold text-base rounded-2xl hover:bg-green-700 disabled:opacity-50 transition-colors mt-6"
          >
            {submitting ? "Memproses..." : "Konfirmasi Check-in"}
          </button>
        </div>
      )}

      {status === "out_of_range" && jobLocation && position && (
        <div className="space-y-4">
          {lateMinutes > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-amber-800 font-semibold">Kamu Terlambat</p>
                  <p className="text-amber-700 text-sm mt-0.5">
                    Terlambat {lateMinutes} menit dari jadwal ({job?.scheduledTime})
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
            </div>
            <p className="text-red-800 font-bold text-base">Kamu di Luar Lokasi Kerja</p>
            <p className="text-red-600 text-sm mt-1">
              Hubungi supervisor jika ada kendala
            </p>
          </div>

          {/* Map showing both locations - only render with valid coordinates */}
          {isValidCoordinatePair(jobLocation.lat, jobLocation.lng, position.lat, position.lng) && (
            <LocationMap
              jobLat={jobLocation.lat}
              jobLng={jobLocation.lng}
              workerLat={position.lat}
              workerLng={position.lng}
              radius={jobLocation.radius}
              jobAddress={jobLocation.address}
            />
          )}

          {!isValidCoordinatePair(jobLocation.lat, jobLocation.lng, position.lat, position.lng) && (
            <div className="w-full h-64 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-center p-4">
              <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <p className="text-slate-500 font-medium">Lokasi tidak tersedia</p>
              <p className="text-slate-400 text-sm mt-1">Tidak dapat menampilkan peta</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Alasan check-in di luar area (wajib):
            </label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Contoh: Gerbang utama terkunci, masuk dari pintu belakang..."
              rows={3}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-xs text-slate-400 mt-2">
              Catatan ini akan dilihat oleh supervisor/admin
            </p>
          </div>

          <button
            onClick={() => handleCheckIn(true)}
            disabled={submitting || overrideReason.trim().length < 10}
            className="w-full py-4 bg-red-600 text-white font-bold text-base rounded-2xl hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Memproses..." : "Check-in Dengan Alasan"}
          </button>
        </div>
      )}
    </div>
  );
}
