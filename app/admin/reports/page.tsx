"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  jobId: string;
  job: {
    jobNumber: string;
    title: string;
    client: { name: string };
  };
  generatedAt: string;
  sentToEmail: string | null;
  sentAt: string | null;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [previewReport, setPreviewReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  // Stats
  const totalReports = reports.length;
  const sentReports = reports.filter((r) => r.sentToEmail).length;
  const pendingReports = totalReports - sentReports;

  // Unique clients for filter
  const clients = [...new Set(reports.map((r) => r.job.client.name))].sort();

  // Filter
  const filteredReports = reports.filter((r) => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !r.job.jobNumber.toLowerCase().includes(query) &&
        !r.job.title.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    // Client filter
    if (clientFilter && r.job.client.name !== clientFilter) return false;
    // Date from
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const reportDate = new Date(r.generatedAt);
      if (reportDate < fromDate) return false;
    }
    // Date to
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      const reportDate = new Date(r.generatedAt);
      if (reportDate > toDate) return false;
    }
    return true;
  });

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Laporan</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {totalReports} laporan tersedia
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{totalReports}</div>
          <div className="text-xs text-slate-500 mt-1">Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{sentReports}</div>
          <div className="text-xs text-slate-500 mt-1">Terkirim</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingReports}</div>
          <div className="text-xs text-slate-500 mt-1">Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari job number atau judul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Client Filter */}
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Semua Klien</option>
          {clients.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-slate-400 text-sm">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="p-2 text-slate-400 hover:text-slate-600"
              title="Clear date filter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#64748B" }}>Memuat...</div>
        ) : filteredReports.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF3C7" }}>
              <svg className="w-6 h-6" style={{ color: "#D97706" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="font-medium text-slate-700">
              {searchQuery || clientFilter || dateFrom || dateTo ? "Tidak ada hasil" : "Belum ada laporan"}
            </p>
            <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
              {searchQuery || clientFilter || dateFrom || dateTo ? "Coba ubah filter pencarian" : "Laporan PDF otomatis tercipta setelah job selesai."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">No. Laporan</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Job</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Klien</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Tanggal</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="border-t hover:bg-slate-50 transition-colors"
                  style={{ borderColor: "#F1F5F9" }}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-medium" style={{ color: "#D97706" }}>
                      {report.job.jobNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{report.job.title}</td>
                  <td className="px-6 py-4" style={{ color: "#475569" }}>{report.job.client.name}</td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#64748B" }}>{formatDate(report.generatedAt)}</td>
                  <td className="px-6 py-4">
                    {report.sentToEmail ? (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Terkirim
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/report/${report.job.jobNumber}`, "_blank")}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors"
                        style={{ color: "#64748B" }}
                        title="Preview"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Preview
                      </button>
                      <a
                        href={`/api/report/${report.jobId}/pdf`}
                        target="_blank"
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                        style={{ color: "#D97706" }}
                        title="Download PDF"
                      >
                        <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
