"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";

interface Job {
  id: string;
  slug: string;
  jobNumber: string;
  title: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  locationAddress: string | null;
  client: { id: string; name: string };
  workers: Array<{ id: string; checkInAt: string | null }>;
  signature: { id: string } | null;
  report: { id: string } | null;
  areas: Array<{ items: Array<{ isDone: boolean }> }>;
}

export default function SupervisorJobsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Use local date to avoid timezone issues
      const now = new Date();
      const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;

      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      // Supervisor sees jobs from today onwards
      params.set("fromDate", dateStr);
      params.set("sort", sortOrder);

      const res = await fetch(`/api/admin/jobs?${params}&includeProgress=true`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch {
      showToast("Gagal memuat jobs", "error");
    }
    setLoading(false);
  }, [searchQuery, statusFilter, showToast, sortOrder]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, sortOrder, fetchJobs]);

  const jobsWithProgress = jobs.map((job) => {
    const allItems = job.areas?.flatMap((a) => a.items) || [];
    const doneItems = allItems.filter((i) => i.isDone).length;
    return {
      ...job,
      progress: { done: doneItems, total: allItems.length },
      checkedInCount: job.workers?.filter((w) => w.checkInAt)?.length || 0,
    };
  });

  const stats = {
    total: jobsWithProgress.length,
    assigned: jobsWithProgress.filter((j) => j.status === "ASSIGNED").length,
    inProgress: jobsWithProgress.filter((j) => j.status === "IN_PROGRESS").length,
    completed: jobsWithProgress.filter((j) => ["COMPLETED", "INVOICED"].includes(j.status)).length,
  };

  return (
    <div className="p-8">
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
            Pekerjaan
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {jobs.length} job ditemukan
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Total Job</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.assigned}</div>
          <div className="text-xs text-slate-500 mt-1">Ditugaskan</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-slate-500 mt-1">Sedang Berjalan</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-slate-500 mt-1">Selesai</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-4 mb-5">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "#94A3B8" }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ASSIGNED">Ditugaskan</option>
          <option value="IN_PROGRESS">Sedang Berjalan</option>
          <option value="COMPLETED">Selesai</option>
          <option value="INVOICED">Ditagih</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>

      {/* Jobs list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#64748B" }}>Memuat...</div>
        ) : jobs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              variant="jobs"
              title="Belum ada pekerjaan"
              description="Tidak ada job yang terjadwal untuk saat ini."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">No. Job</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Judul</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Klien</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">TTD</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">PDF</th>
                </tr>
              </thead>
              <tbody>
                {jobsWithProgress.map((job) => (
                  <tr
                    key={job.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                    style={{ borderColor: "#F1F5F9" }}
                  >
                    <td className="px-6 py-4 font-mono text-xs" style={{ color: "#64748B" }}>
                      {job.jobNumber}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/supervisor/jobs/${job.slug}`}
                        className="font-semibold text-slate-900 hover:underline"
                        style={{ textDecorationColor: "#D97706" }}
                      >
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4" style={{ color: "#475569" }}>
                      {job.client?.name}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "#64748B" }}>
                      {new Date(job.scheduledDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-6 py-4">
                      {job.signature ? (
                        <span
                          title="Sudah ditandatangani"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full"
                          style={{ background: "#DCFCE7" }}
                        >
                          <svg className="w-3.5 h-3.5" style={{ color: "#16A34A" }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-block w-6 h-6" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {job.report ? (
                        <a
                          href={`/api/report/${job.id}/pdf`}
                          target="_blank"
                          className="text-sm font-medium hover:underline"
                          style={{ color: "#D97706" }}
                        >
                          Download
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
