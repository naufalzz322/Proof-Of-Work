"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import imageCompression from "browser-image-compression";
import PhotoComparison from "@/components/field/PhotoComparison";
import BatteryIndicator from "@/components/field/BatteryIndicator";
import { useJobTimer } from "@/hooks/useJobTimer";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center">
      <span className="text-sm text-slate-400">Memuat peta...</span>
    </div>
  ),
});

interface AreaPhoto {
  id: string;
  url: string;
  type: string;
  localData?: string; // base64 for locally stored photos
}

interface AreaData {
  id: string;
  name: string;
  items: { id: string; label: string; isDone: boolean }[];
  photos: AreaPhoto[];
}

interface Job {
  id: string;
  slug: string;
  title: string;
  locationLat: number | null;
  locationLng: number | null;
  workers?: { workerId: string; checkInAt: string | null }[];
}

export default function AreaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const areaId = params.areaId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [area, setArea] = useState<AreaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">("saved");
  const [showComparison, setShowComparison] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Pending photos that haven't been uploaded yet (stored locally)
  const [pendingPhotos, setPendingPhotos] = useState<AreaPhoto[]>([]);

  // Hooks
  const { formattedTime, start: startTimer } = useJobTimer(slug || "", isCheckedIn);
  const { enabled: notificationsEnabled } = usePushNotifications();

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get all photos (from DB + pending local)
  const allPhotos = [
    ...(area?.photos || []),
    ...pendingPhotos.filter(p => !area?.photos.some(ap => ap.id === p.id && ap.type === p.type)),
  ];

  // Upload all pending photos when back online
  useEffect(() => {
    if (isOnline && pendingPhotos.length > 0) {
      uploadPendingPhotos();
    }
  }, [isOnline]);

  const uploadPendingPhotos = async () => {
    if (!jobId || pendingPhotos.length === 0) return;

    const photosToUpload = [...pendingPhotos];
    setPendingPhotos([]);

    for (const photo of photosToUpload) {
      if (photo.localData) {
        try {
          // Convert base64 to blob
          const response = await fetch(photo.localData);
          const blob = await response.blob();
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });

          const formData = new FormData();
          formData.append("file", file);
          formData.append("areaId", areaId);
          formData.append("type", photo.type);

          const res = await fetch(`/api/jobs/${jobId}/photos`, {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            setArea((prev) =>
              prev
                ? { ...prev, photos: [...prev.photos, { id: data.id, type: photo.type, url: data.url }] }
                : prev
            );
          }
        } catch (err) {
          console.error("Failed to upload pending photo:", err);
          // Re-add to pending if failed
          setPendingPhotos((prev) => [...prev, photo]);
        }
      }
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (!notificationsEnabled && "Notification" in window && Notification.permission === "default") {
      // Don't auto-request, let user know there's an option
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    if (!slug || !areaId) return;
    fetch(`/api/jobs/slug/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setLoading(false);
          return;
        }
        setJob(data);
        setJobId(data.id);
        // Check if worker is checked in
        if (data.workers) {
          const mySession = data.workers.find((w: { workerId: string; checkInAt: string | null }) => w.checkInAt);
          if (mySession) {
            setIsCheckedIn(true);
            startTimer();
          }
        }
        return fetch(`/api/jobs/${data.id}/areas/${areaId}`);
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) {
          setArea(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, areaId, startTimer]);

  const toggleItem = useCallback(async (itemId: string) => {
    if (!area || !jobId) return;
    const item = area.items.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    setArea((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? { ...i, isDone: !i.isDone } : i
            ),
          }
        : prev
    );
    setSaveStatus("saving");

    try {
      const res = await fetch(`/api/jobs/${jobId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isDone: !item.isDone }),
      });

      if (res.ok) {
        setSaveStatus("saved");
      } else {
        // Revert on error
        setArea((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((i) =>
                  i.id === itemId ? { ...i, isDone: item.isDone } : i
                ),
              }
            : prev
        );
        setSaveStatus(isOnline ? "saved" : "offline");
      }
    } catch {
      // Offline - keep optimistic update, mark as offline
      setSaveStatus("offline");
    }
  }, [area, jobId, isOnline]);

  const uploadPhoto = async (type: "BEFORE" | "AFTER") => {
    if (!jobId) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setPhotoUploading(type);

      try {
        // Compress image before processing
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.5, // Max 500KB
          maxWidthOrHeight: 1200, // Max dimension 1200px
          useWebWorker: true,
        });

        // Convert to base64 for local storage
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;

          // Store locally first with a temporary ID
          const tempId = `temp_${Date.now()}`;
          const localPhoto: AreaPhoto = {
            id: tempId,
            url: base64,
            type,
            localData: base64,
          };

          // Add to pending photos (not uploaded yet)
          setPendingPhotos((prev) => [...prev, localPhoto]);
          setPhotoUploading(null);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error("Failed to process photo:", err);
        setPhotoUploading(null);
      }
    };

    input.click();
  };

  // Delete a pending photo (only local, not uploaded)
  const deletePendingPhoto = (type: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p.type !== type));
  };

  // Upload all photos and navigate to areas list
  const handleAreaComplete = async () => {
    if (pendingPhotos.length > 0 && isOnline) {
      setSaveStatus("saving");
      await uploadPendingPhotos();
      setSaveStatus("saved");
    }
    router.push(`/field/jobs/${slug}/areas`);
  };

  // Get all areas for navigation
  const [allAreas, setAllAreas] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (jobId) {
      fetch(`/api/jobs/${jobId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.areas) {
            setAllAreas(data.areas.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
          }
        });
    }
  }, [jobId]);

  const currentIndex = allAreas.findIndex((a) => a.id === areaId);
  const prevArea = currentIndex > 0 ? allAreas[currentIndex - 1] : null;
  const nextArea = currentIndex < allAreas.length - 1 ? allAreas[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-48 bg-slate-200 rounded-xl" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!area) {
    return <div className="px-4 pt-4 text-center text-red-500">Area tidak ditemukan</div>;
  }

  const beforePhoto = allPhotos.find((p) => p.type === "BEFORE");
  const afterPhoto = allPhotos.find((p) => p.type === "AFTER");
  const allDone = area.items.every((i) => i.isDone);

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/field/jobs/${slug}/areas`)} className="text-slate-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900">{area.name}</h1>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-3">
          {/* Job Timer */}
          {isCheckedIn && (
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-mono text-slate-600">{formattedTime}</span>
            </div>
          )}

          {/* Pending uploads indicator */}
          {pendingPhotos.length > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-1" title={`${pendingPhotos.length} foto menunggu upload`}>
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {pendingPhotos.length}
            </span>
          )}

          {/* Save status */}
          {saveStatus === "saving" && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          )}
          {saveStatus === "saved" && isOnline && (
            <span className="text-xs text-green-600" title="Tersimpan">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
          )}
          {saveStatus === "offline" && (
            <span className="text-xs text-slate-400" title="Tersimpan offline">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
            </span>
          )}

          {/* Online indicator */}
          {isOnline ? (
            <span className="w-2 h-2 rounded-full bg-green-500" title="Online" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-400" title="Offline" />
          )}

          {/* Battery indicator */}
          <BatteryIndicator />
        </div>
      </div>

      {/* Photos Before/After */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase">Sebelum</p>
          {beforePhoto ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <img src={beforePhoto.url} alt="Before" className="w-full aspect-square object-cover" />
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Delete button for pending photos */}
              {beforePhoto.localData && (
                <button
                  onClick={() => deletePendingPhoto("BEFORE")}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Hapus foto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => uploadPhoto("BEFORE")}
              disabled={photoUploading !== null}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors"
            >
              {photoUploading === "BEFORE" ? (
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span className="text-xs font-medium">Ambil Foto</span>
                </>
              )}
            </button>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5 uppercase">Sesudah</p>
          {!beforePhoto ? (
            <div className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-xs">
              Ambil foto &quot;Sebelum&quot; dulu
            </div>
          ) : afterPhoto ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200">
              <img src={afterPhoto.url} alt="After" className="w-full aspect-square object-cover" />
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Delete button for pending photos */}
              {afterPhoto.localData && (
                <button
                  onClick={() => deletePendingPhoto("AFTER")}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Hapus foto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {/* Compare button */}
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="absolute bottom-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
                title="Bandingkan"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66z" />
                </svg>
              </button>
            </div>
          ) : !allDone ? (
            <div className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-xs">
              Selesaikan checklist dulu
            </div>
          ) : (
            <button
              onClick={() => uploadPhoto("AFTER")}
              disabled={photoUploading !== null}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-green-400 hover:text-green-600 transition-colors"
            >
              {photoUploading === "AFTER" ? (
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span className="text-xs font-medium">Ambil Foto</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Photo Comparison (swipe) */}
      {showComparison && beforePhoto && afterPhoto && (
        <PhotoComparison beforeUrl={beforePhoto.url} afterUrl={afterPhoto.url} />
      )}

      {/* Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-800 text-sm">Checklist</h2>
              <p className="text-xs text-slate-400">
                {area.items.filter((i) => i.isDone).length}/{area.items.length} selesai
              </p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              allDone ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
            }`}>
            {allDone ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Selesai
              </span>
            ) : `${Math.round((area.items.filter(i => i.isDone).length / area.items.length) * 100)}%`}
            </span>
          </div>
        </div>

        {area.items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 text-left transition-colors active:bg-amber-50"
          >
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              item.isDone
                ? "bg-green-500 border-green-500 text-white"
                : "border-slate-300 bg-white hover:border-amber-400"
            }`}>
              {item.isDone && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${item.isDone ? "text-slate-400 line-through" : "text-slate-800"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Area Navigation Buttons */}
      {(prevArea || nextArea) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="flex gap-3">
            {prevArea ? (
              <button
                onClick={() => router.push(`/field/jobs/${slug}/areas/${prevArea!.id}`)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                {prevArea.name}
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nextArea && (
              <button
                onClick={() => router.push(`/field/jobs/${slug}/areas/${nextArea!.id}`)}
                className="flex-1 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                {nextArea.name}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {allDone && afterPhoto && (
        <div className="mt-4">
          <button
            onClick={handleAreaComplete}
            disabled={saveStatus === "saving" || pendingPhotos.length > 0 && !isOnline}
            className="w-full py-4 bg-green-600 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saveStatus === "saving" ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengupload Foto...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Area Selesai
              </>
            )}
          </button>
          {pendingPhotos.length > 0 && !isOnline && (
            <p className="text-xs text-amber-600 text-center mt-2">
              Foto akan diupload saat koneksi tersedia
            </p>
          )}
        </div>
      )}
    </div>
  );
}
