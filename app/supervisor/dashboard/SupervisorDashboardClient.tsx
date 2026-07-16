"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

// Types
interface Worker {
  id: string;
  name: string;
  phone: string;
  status: "available" | "working" | "on_break" | "not_scheduled";
  currentJob: { id: string; slug: string; title: string } | null;
  progress: number;
  checkInAt: string | null;
  isLate: boolean;
}

interface Job {
  id: string;
  slug: string;
  title: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  locationAddress: string | null;
  client: { name: string };
  progress: { done: number; total: number };
  checkedInCount: number;
  totalWorkers: number;
  hasSignature: boolean;
  areas?: Array<{ id: string; name: string; items: Array<{ isDone: boolean }> }>;
}

interface Activity {
  id: string;
  type: "checkin" | "complete" | "issue";
  workerName: string;
  jobTitle: string;
  clientName: string;
  time: string;
  jobSlug: string;
}

interface Alerts {
  lowProgressCount: number;
  lateWorkerCount: number;
  noCheckInCount: number;
}

interface Stats {
  totalJobs: number;
  checkedIn: number;
  notCheckedIn: number;
  lowProgress: number;
  lateWorkers: number;
}

interface JobGroup {
  pagi: Job[];
  siang: Job[];
  sore: Job[];
  malam: Job[];
}

export default function SupervisorDashboardClient() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobGroups, setJobGroups] = useState<JobGroup | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "timeline" | "list">("grid");
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showLowProgressOnly, setShowLowProgressOnly] = useState(false);
  const lowProgressSectionRef = useRef<HTMLDivElement>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/supervisor/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setJobs(data.jobs);
        setJobGroups(data.jobGroups);
        setWorkers(data.workers);
        setActivityFeed(data.activityFeed);
        setAlerts(data.alerts);
      }
    } catch {
      showToast("Gagal memuat data dashboard", "error");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  function formatTime(time: string): string {
    return new Date(time).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRelativeTime(time: string): string {
    const diff = Date.now() - new Date(time).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins}m lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}j lalu`;
    return `${Math.floor(hours / 24)}h lalu`;
  }

  function getWorkerInitials(name: string): string {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  function getWorkerStatusColor(status: string, isLate: boolean): { bg: string; text: string; dot: string } {
    if (isLate) return { bg: "#FEE2E2", text: "#DC2626", dot: "#DC2626" };
    switch (status) {
      case "working": return { bg: "#DCFCE7", text: "#16A34A", dot: "#22C55E" };
      case "on_break": return { bg: "#FEF3C7", text: "#D97706", dot: "#F59E0B" };
      default: return { bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8" };
    }
  }

  function getProgressColor(done: number, total: number): string {
    if (total === 0) return "#94A3B8";
    const pct = (done / total) * 100;
    if (pct >= 100) return "#22C55E";
    if (pct >= 50) return "#D97706";
    return "#EF4444";
  }

  if (loading) {
    return (
      <div className="p-8">
        <Breadcrumb />
        <div className="animate-pulse space-y-6 mt-6">
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="h-48 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
            Monitoring Tim
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts && (alerts.lowProgressCount > 0 || alerts.lateWorkerCount > 0 || alerts.noCheckInCount > 0) && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border cursor-pointer hover:bg-slate-50 transition-colors"
          style={{ background: "#FEF3C7", borderColor: "#FDE68A" }}
          onClick={() => {
            setShowLowProgressOnly(true);
            setTimeout(() => lowProgressSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
          }}
        >
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {alerts.lowProgressCount > 0 && (
              <div className="flex items-center gap-2 text-amber-700">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold">{alerts.lowProgressCount} job perlu perhatian</span>
              </div>
            )}
            {alerts.lateWorkerCount > 0 && (
              <div className="flex items-center gap-2 text-orange-700">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold">{alerts.lateWorkerCount} worker telat</span>
              </div>
            )}
            {alerts.noCheckInCount > 0 && (
              <div className="flex items-center gap-2 text-slate-700">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold">{alerts.noCheckInCount} belum check-in</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="card p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats?.totalJobs || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Total Job</div>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-green-600">{stats?.checkedIn || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Sudah Check-in</div>
        </div>
        <div className="card p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-amber-600">{stats?.notCheckedIn || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Belum Check-in</div>
        </div>
        <div
          className="card p-3 sm:p-4 text-center cursor-pointer transition-all hover:shadow-md col-span-2 lg:col-span-1"
          onClick={() => {
            setShowLowProgressOnly(true);
            setTimeout(() => lowProgressSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
          }}
        >
          <div className="text-xl sm:text-2xl font-bold text-amber-600">{stats?.lowProgress || 0}</div>
          <div className="text-xs text-slate-500 mt-1">Progress Rendah</div>
        </div>
      </div>

      {/* Low Progress Jobs Section */}
      <div ref={lowProgressSectionRef} className={`mb-4 sm:mb-6 transition-all duration-300 ${showLowProgressOnly ? "block" : "hidden"}`}>
        <div className="card overflow-hidden border-2 border-amber-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ background: "#FEF3C7", borderBottom: "1px solid #FDE68A" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <h2 className="font-display font-semibold text-amber-800 text-sm sm:text-base">Job Perlu Perhatian</h2>
                <p className="text-xs text-amber-600">{stats?.lowProgress || 0} job dengan progress rendah</p>
              </div>
            </div>
            <button
              onClick={() => setShowLowProgressOnly(false)}
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 hover:underline self-start sm:self-auto"
            >
              Tutup ×
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: "#FEF3C7" }}>
            {jobs.filter(j => {
              if (j.status === "COMPLETED" || j.status === "INVOICED") return false;
              if (j.progress.total === 0) return false;
              const pct = (j.progress.done / j.progress.total) * 100;
              return pct < 50;
            }).length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">Semua job berjalan dengan baik 🎉</p>
              </div>
            ) : (
              jobs
                .filter(j => {
                  if (j.status === "COMPLETED" || j.status === "INVOICED") return false;
                  if (j.progress.total === 0) return false;
                  const pct = (j.progress.done / j.progress.total) * 100;
                  return pct < 50;
                })
                .map((job) => {
                  const progressPct = job.progress.total > 0 ? Math.round((job.progress.done / job.progress.total) * 100) : 0;
                  const timeElapsed = (() => {
                    const scheduled = new Date(`${job.scheduledDate}T${job.scheduledTime}`);
                    const now = new Date();
                    const diffMs = now.getTime() - scheduled.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                  })();

                  return (
                    <Link
                      key={job.id}
                      href={`/supervisor/jobs/${job.slug}`}
                      className="block px-6 py-4 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                              {progressPct}% SELESAI
                            </span>
                            <span className="text-xs text-slate-400">{job.jobNumber}</span>
                          </div>
                          <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                          <p className="text-xs text-slate-500">{job.client.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-slate-400">
                              <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Waktu: {timeElapsed}
                            </p>
                            <p className="text-xs text-slate-400">
                              {job.checkedInCount}/{job.totalWorkers} check-in
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <StatusBadge status={job.status} />
                          <p className="text-xs text-amber-600 font-semibold mt-2">
                            {job.progress.done}/{job.progress.total} item
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Worker Status Grid / Activity Feed */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Worker Status Grid */}
          <div className="card overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="font-display font-semibold text-slate-900 text-sm sm:text-base">Status Worker</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> Working
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> On Break
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Idle
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Late
                </span>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {workers.map((worker) => {
                  const colors = getWorkerStatusColor(worker.status, worker.isLate);
                  const workerJob = jobs.find(j => j.id === worker.currentJob?.id);
                  const isLowProgress = workerJob && workerJob.status === "IN_PROGRESS" && workerJob.progress.total > 0 && worker.progress < 50;

                  return (
                    <div
                      key={worker.id}
                      className={`p-3 rounded-xl transition-all hover:shadow-md cursor-pointer ${isLowProgress ? 'ring-2 ring-amber-400' : ''}`}
                      style={{ background: colors.bg }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                          style={{ background: worker.isLate ? "#DC2626" : worker.status === "working" ? "#16A34A" : "#64748B" }}
                        >
                          {getWorkerInitials(worker.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: colors.text }}>
                            {worker.name}
                          </p>
                          <p className="text-xs truncate opacity-70" style={{ color: colors.text }}>
                            {worker.status === "working" ? "Working" :
                             worker.status === "on_break" ? "On Break" :
                             worker.isLate ? "Late" : "Idle"}
                          </p>
                        </div>
                      </div>
                      {worker.currentJob && (
                        <p className="text-xs truncate opacity-80" style={{ color: colors.text }}>
                          {worker.currentJob.title}
                        </p>
                      )}
                      {worker.status === "working" && (
                        <div className="mt-2">
                          <div className="w-full rounded-full h-1" style={{ background: "rgba(0,0,0,0.1)" }}>
                            <div
                              className="h-1 rounded-full"
                              style={{ width: `${worker.progress}%`, background: colors.dot }}
                            />
                          </div>
                          <p className="text-xs mt-1 opacity-70" style={{ color: colors.text }}>{worker.progress}%</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="font-display font-semibold text-slate-900">Aktivitas Terbaru</h2>
              <span className="text-xs text-slate-400">Live</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {activityFeed.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm">Belum ada aktivitas</p>
                </div>
              ) : (
                activityFeed.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                    style={{ borderBottom: "1px solid #F1F5F9" }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#D97706" }}>
                      {getWorkerInitials(activity.workerName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900">
                        <span className="font-semibold">{activity.workerName}</span> check-in
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {activity.jobTitle} @ {activity.clientName}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-green-600 font-medium">{formatTime(activity.time)}</p>
                      <p className="text-xs text-slate-400">{formatRelativeTime(activity.time)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Jobs List based on view mode */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="font-display font-semibold text-slate-900">Job Hari Ini</h2>
              <Link href="/supervisor/jobs" className="text-xs font-semibold text-amber-600 hover:underline">
                Lihat Semua →
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {jobs.slice(0, 5).map((job) => {
                const progressPct = job.progress.total > 0 ? Math.round((job.progress.done / job.progress.total) * 100) : 0;
                const progressColor = getProgressColor(job.progress.done, job.progress.total);
                const isLowProgress = job.status === "IN_PROGRESS" && job.progress.total > 0 && progressPct < 50;
                return (
                  <div
                    key={job.id}
                    className={`px-6 py-4 transition-colors cursor-pointer ${isLowProgress ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-slate-50"}`}
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs" style={{ color: "#94A3B8" }}>{job.jobNumber}</span>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                        <p className="text-xs text-slate-500">{job.client.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{job.scheduledTime} • {job.checkedInCount}/{job.totalWorkers} check-in</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: progressColor }}>{progressPct}%</p>
                        <div className="w-16 rounded-full h-1.5 mt-1" style={{ background: "#F1F5F9" }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${progressPct}%`, background: progressColor }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{job.progress.done}/{job.progress.total} item</p>
                      </div>
                    </div>

                    {/* Expanded job details */}
                    {selectedJob === job.id && job.areas && (
                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid #E2E8F0" }}>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Area Progress:</p>
                        <div className="space-y-2">
                          {job.areas.map((area) => {
                            const areaDone = area.items.filter((i) => i.isDone).length;
                            const areaPct = area.items.length > 0 ? Math.round((areaDone / area.items.length) * 100) : 0;
                            return (
                              <div key={area.id} className="flex items-center gap-2">
                                <span className="text-xs w-20 sm:w-24 truncate text-slate-600">{area.name}</span>
                                <div className="flex-1 rounded-full h-1.5" style={{ background: "#F1F5F9" }}>
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{ width: `${areaPct}%`, background: areaPct === 100 ? "#22C55E" : "#D97706" }}
                                  />
                                </div>
                                <span className="text-xs text-slate-400 w-10 sm:w-12 text-right">
                                  {areaDone}/{area.items.length}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex gap-3">
                          <Link
                            href={`/supervisor/jobs/${job.slug}`}
                            className="text-xs font-semibold text-amber-600 hover:underline"
                          >
                            Detail →
                          </Link>
                          {job.hasSignature && (
                            <Link
                              href={`/report/${job.slug}`}
                              target="_blank"
                              className="text-xs font-semibold text-green-600 hover:underline"
                            >
                              Lihat Laporan →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Time-based Groups */}
        <div className="space-y-4 sm:space-y-6">
          {/* Pagi Jobs (06:00 - 11:59) */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #FEF3C7", background: "#FFFBEB" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-amber-800">Pagi</h3>
                <span className="text-xs text-amber-600">06:00-11:59</span>
              </div>
              <span className="text-xs font-semibold text-amber-600">{jobGroups?.pagi.length || 0} job</span>
            </div>
            <div className="p-3 space-y-2">
              {jobGroups?.pagi.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Tidak ada job</p>
              ) : (
                jobGroups?.pagi.map((job) => (
                  <Link
                    key={job.id}
                    href={`/supervisor/jobs/${job.slug}`}
                    className="block p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{job.scheduledTime}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-xs text-slate-600 truncate">{job.title}</p>
                    <p className="text-xs text-slate-400 truncate">{job.client.name}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Siang Jobs (12:00 - 16:59) */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #FEF9C3", background: "#FEFDE7" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-yellow-800">Siang</h3>
                <span className="text-xs text-yellow-600">12:00-16:59</span>
              </div>
              <span className="text-xs font-semibold text-yellow-600">{jobGroups?.siang.length || 0} job</span>
            </div>
            <div className="p-3 space-y-2">
              {jobGroups?.siang.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Tidak ada job</p>
              ) : (
                jobGroups?.siang.map((job) => (
                  <Link
                    key={job.id}
                    href={`/supervisor/jobs/${job.slug}`}
                    className="block p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{job.scheduledTime}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-xs text-slate-600 truncate">{job.title}</p>
                    <p className="text-xs text-slate-400 truncate">{job.client.name}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Sore Jobs (17:00 - 20:59) */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #FED7AA", background: "#FFF7ED" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-orange-800">Sore</h3>
                <span className="text-xs text-orange-600">17:00-20:59</span>
              </div>
              <span className="text-xs font-semibold text-orange-600">{jobGroups?.sore.length || 0} job</span>
            </div>
            <div className="p-3 space-y-2">
              {jobGroups?.sore.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Tidak ada job</p>
              ) : (
                jobGroups?.sore.map((job) => (
                  <Link
                    key={job.id}
                    href={`/supervisor/jobs/${job.slug}`}
                    className="block p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{job.scheduledTime}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-xs text-slate-600 truncate">{job.title}</p>
                    <p className="text-xs text-slate-400 truncate">{job.client.name}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Malam Jobs (21:00 - 05:59) */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #C7D2FE", background: "#EEF2FF" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 12c0 5.385 4.365 9.75 9.75 9.75s9.75-4.365 9.75-9.75c0-.53-.06-1.05-.175-1.555z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-indigo-800">Malam</h3>
                <span className="text-xs text-indigo-600">21:00-05:59</span>
              </div>
              <span className="text-xs font-semibold text-indigo-600">{jobGroups?.malam?.length || 0} job</span>
            </div>
            <div className="p-3 space-y-2">
              {jobGroups?.malam?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Tidak ada job</p>
              ) : (
                jobGroups?.malam.map((job) => (
                  <Link
                    key={job.id}
                    href={`/supervisor/jobs/${job.slug}`}
                    className="block p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{job.scheduledTime}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-xs text-slate-600 truncate">{job.title}</p>
                    <p className="text-xs text-slate-400 truncate">{job.client.name}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-4">
            <h3 className="font-semibold text-slate-700 mb-3">Ringkasan</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Area</span>
                <span className="font-semibold text-slate-700">
                  {jobs.reduce((sum, j) => sum + (j.progress?.total || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Item Selesai</span>
                <span className="font-semibold text-green-600">
                  {jobs.reduce((sum, j) => sum + (j.progress?.done || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Avg Progress</span>
                <span className="font-semibold text-amber-600">
                  {jobs.length > 0
                    ? Math.round(jobs.reduce((sum, j) => {
                        const total = j.progress?.total || 0;
                        const done = j.progress?.done || 0;
                        return sum + (total > 0 ? (done / total) * 100 : 0);
                      }, 0) / jobs.length)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
