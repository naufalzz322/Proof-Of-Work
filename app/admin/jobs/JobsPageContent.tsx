"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import EmptyState from "@/components/EmptyState";
import JobFormModal from "./JobFormModal";
import { useToast } from "@/components/Toast";
import StatusBadge from "@/components/StatusBadge";

interface Job {
  id: string;
  slug: string;
  jobNumber: string;
  title: string;
  status: string;
  scheduledDate: string;
  client: { id: string; name: string };
  signature: { id: string } | null;
  report: { id: string } | null;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  areas: { id: string; name: string; items: { id: string; label: string }[] }[];
}

export default function JobsPageContent() {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const searchParams = useSearchParams();
  const clientSlug = searchParams.get("client");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      if (clientSlug) params.set("client", clientSlug);
      params.set("sort", sortOrder);

      const res = await fetch(`/api/admin/jobs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch {
      showToast("Gagal memuat jobs", "error");
    }
    setLoading(false);
  }, [searchQuery, statusFilter, clientSlug, showToast, sortOrder]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/admin/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch {
      // ignore
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
    fetchTemplates();
  }, [fetchJobs]);

  // Debounced search on searchQuery/statusFilter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, sortOrder, fetchJobs]);

  return (
    <div className="p-8">
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Pekerjaan</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {clientSlug
              ? `${jobs.length} job untuk klien ini`
              : `${jobs.length} job ditemukan`}
          </p>
        </div>
        <div className="flex gap-2">
          {clientSlug && (
            <Link
              href="/admin/clients"
              className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              ← Semua Klien
            </Link>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary px-5 py-2 rounded-xl font-semibold text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Job Baru
          </button>
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
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
              actionLabel="Buat Job Baru"
              onAction={() => setShowModal(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">No. Job</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Judul</th>
                  {!clientSlug && (
                    <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Klien</th>
                  )}
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">TTD</th>
                  <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">PDF</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
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
                        href={`/admin/jobs/${job.slug}`}
                        className="font-semibold text-slate-900 hover:underline"
                        style={{ textDecorationColor: "#D97706" }}
                      >
                        {job.title}
                      </Link>
                    </td>
                    {!clientSlug && (
                      <td className="px-6 py-4" style={{ color: "#475569" }}>
                        {job.client.name}
                      </td>
                    )}
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

      {/* Create Job Modal */}
      <JobFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchJobs}
        templates={templates}
      />
    </div>
  );
}
