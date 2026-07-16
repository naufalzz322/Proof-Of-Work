"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

interface ChecklistItem {
  id: string;
  label: string;
  isDone: boolean;
}

interface Area {
  id: string;
  name: string;
  items: ChecklistItem[];
  photos: { type: string; url: string }[];
}

interface JobData {
  id: string;
  slug: string;
  title: string;
  status: string;
  notes: string | null;
  areas: Area[];
}

export default function AreasPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);

  const fetchJobData = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await fetch(`/api/jobs/slug/${slug}`).then(r => r.json());
      if (data.error) {
        setError(data.error);
      } else {
        const fullData = await fetch(`/api/jobs/${data.id}`).then(r => r.json());
        setJob(fullData);
      }
    } catch {
      setError("Gagal memuat data");
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  if (loading) {
    return (
      <div className="px-4 pt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          <div className="h-2 bg-slate-200 rounded-full" />
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-24" />
                    <div className="h-3 bg-slate-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <EmptyState
        variant="general"
        title="Gagal memuat data"
        description={error || "Terjadi kesalahan saat mengambil data job."}
        actionLabel="Coba Lagi"
        onAction={() => window.location.reload()}
      />
    );
  }

  const totalItems = job.areas.flatMap((a) => a.items).length;
  const doneItems = job.areas.flatMap((a) => a.items).filter((i) => i.isDone).length;
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const allDone = doneItems === totalItems;

  // Sort areas by name for consistent navigation
  const sortedAreas = [...job.areas].sort((a, b) => a.name.localeCompare(b.name));
  const currentArea = sortedAreas[currentAreaIndex];
  const hasPrev = currentAreaIndex > 0;
  const hasNext = currentAreaIndex < sortedAreas.length - 1;

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Header */}
      <h1 className="text-lg font-bold text-slate-900 mb-1">{job.title}</h1>

      {/* Admin Notes */}
      {job.notes && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            <p className="text-xs font-semibold text-amber-700">Catatan dari Admin</p>
          </div>
          <p className="text-sm text-amber-800">{job.notes}</p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress Keseluruhan</span>
          <span>{doneItems}/{totalItems} tugas ({progress}%)</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${allDone ? "bg-green-500" : "bg-amber-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Area Navigation */}
      {job.areas.length > 1 && (
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            onClick={() => setCurrentAreaIndex(Math.max(0, currentAreaIndex - 1))}
            disabled={!hasPrev}
            className={`p-2 rounded-lg ${hasPrev ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "text-slate-300"}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="text-sm text-slate-600 font-medium">
            Area {currentAreaIndex + 1} dari {job.areas.length}
          </div>
          <button
            onClick={() => setCurrentAreaIndex(Math.min(sortedAreas.length - 1, currentAreaIndex + 1))}
            disabled={!hasNext}
            className={`p-2 rounded-lg ${hasNext ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "text-slate-300"}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Current Area Card */}
      {currentArea && (
        <Link
          key={currentArea.id}
          href={`/field/jobs/${slug}/areas/${currentArea.id}`}
          className="block bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                currentArea.items.every(i => i.isDone)
                  ? "bg-green-100 text-green-700"
                  : currentArea.items.some(i => i.isDone)
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}>
                {currentArea.items.every(i => i.isDone) ? "✓" : currentArea.items.some(i => i.isDone) ? "◐" : "○"}
              </div>
              <div>
                <p className="font-bold text-slate-900">{currentArea.name}</p>
                <p className="text-sm text-slate-500">
                  {currentArea.items.filter(i => i.isDone).length}/{currentArea.items.length} tugas
                </p>
              </div>
            </div>
            <span className="text-amber-600 text-sm font-semibold">Buka →</span>
          </div>

          {/* Photo count */}
          <div className="flex gap-3 mb-3">
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              currentArea.photos.some(p => p.type === "BEFORE")
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <span>Sebelum: {currentArea.photos.some(p => p.type === "BEFORE") ? "✓" : "○"}</span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              currentArea.photos.some(p => p.type === "AFTER")
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <span>Sesudah: {currentArea.photos.some(p => p.type === "AFTER") ? "✓" : "○"}</span>
            </div>
          </div>

          {/* Progress bar for current area */}
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                currentArea.items.every(i => i.isDone) ? "bg-green-500" : "bg-amber-500"
              }`}
              style={{
                width: `${currentArea.items.length > 0
                  ? (currentArea.items.filter(i => i.isDone).length / currentArea.items.length) * 100
                  : 0}%`
              }}
            />
          </div>
        </Link>
      )}

      {/* Other Areas List */}
      {job.areas.length > 1 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Semua Area
          </h3>
          <div className="space-y-2">
            {sortedAreas.map((area, idx) => {
              const areaDone = area.items.filter(i => i.isDone).length;
              const areaTotal = area.items.length;
              const areaDone2 = areaDone === areaTotal;
              const photoCount = area.photos.length;
              const beforeCount = area.photos.filter(p => p.type === "BEFORE").length;
              const afterCount = area.photos.filter(p => p.type === "AFTER").length;

              return (
                <Link
                  key={area.id}
                  href={`/field/jobs/${slug}/areas/${area.id}`}
                  className={`block bg-white rounded-xl border p-4 ${
                    idx === currentAreaIndex ? "border-amber-300" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        areaDone2
                          ? "bg-green-100 text-green-700"
                          : areaDone > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {areaDone2 ? "✓" : areaDone > 0 ? "◐" : "○"}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{area.name}</p>
                        <p className="text-xs text-slate-500">
                          {areaDone}/{areaTotal} tugas
                          {photoCount > 0 && ` · ${photoCount} foto`}
                          {!areaDone2 && photoCount === 0 && " · belum ada foto"}
                          {beforeCount > 0 && ` (${beforeCount} sebelum)`}
                          {afterCount > 0 && ` (${afterCount} sesudah)`}
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-400 text-sm">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Done - go to sign */}
      {allDone && (
        <div className="mt-6">
          <Link
            href={`/field/jobs/${slug}/sign`}
            className="block w-full py-4 bg-green-600 text-white font-bold text-base rounded-2xl text-center"
          >
            Semua Selesai — Minta Tanda Tangan
          </Link>
        </div>
      )}
    </div>
  );
}
