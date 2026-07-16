"use client";

import { useState, useEffect } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import EmptyState from "@/components/EmptyState";
import WorkerFormModal from "./WorkerFormModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "SUPERVISOR" | "FIELD";
  status?: "AVAILABLE" | "BUSY";
  currentJob?: { id: string; title: string } | null;
  completedJobs?: number;
  lastJob?: string | null;
  memberSince?: string;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  SUPERVISOR: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  FIELD: "bg-green-50 text-green-700 ring-1 ring-green-200",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  FIELD: "Field Worker",
};

type StatusFilter = "all" | "available" | "busy";
type RoleFilter = "all" | "ADMIN" | "SUPERVISOR" | "FIELD";

export default function WorkersPage() {
  const { showToast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    try {
      const res = await fetch("/api/admin/workers?withStats=true&withStatus=true");
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } catch {
      showToast("Gagal memuat worker", "error");
    }
    setLoading(false);
  }

  function openCreateModal() {
    setEditingWorker(null);
    setShowModal(true);
  }

  function openEditModal(worker: Worker) {
    setEditingWorker(worker);
    setShowModal(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/workers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Worker dihapus", "success");
        setDeleteTarget(null);
        fetchWorkers();
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setDeleting(false);
  }

  // Stats
  const totalWorkers = workers.length;
  const availableWorkers = workers.filter((w) => w.role === "FIELD" && w.status === "AVAILABLE").length;
  const busyWorkers = workers.filter((w) => w.role === "FIELD" && w.status === "BUSY").length;
  const fieldWorkers = workers.filter((w) => w.role === "FIELD").length;

  // Filter
  const filteredWorkers = workers.filter((w) => {
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!w.name.toLowerCase().includes(query) && !w.email.toLowerCase().includes(query)) {
        return false;
      }
    }
    // Role filter
    if (roleFilter !== "all" && w.role !== roleFilter) return false;
    // Status filter (only for FIELD workers)
    if (w.role === "FIELD") {
      if (statusFilter === "available" && w.status !== "AVAILABLE") return false;
      if (statusFilter === "busy" && w.status !== "BUSY") return false;
    }
    return true;
  });

  return (
    <div className="p-8">
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Tim Kerja</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {fieldWorkers} worker lapangan aktif
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Worker
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{totalWorkers}</div>
          <div className="text-xs text-slate-500 mt-1">Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{availableWorkers}</div>
          <div className="text-xs text-slate-500 mt-1">Tersedia</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{busyWorkers}</div>
          <div className="text-xs text-slate-500 mt-1">Sibuk</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{fieldWorkers}</div>
          <div className="text-xs text-slate-500 mt-1">Field Worker</div>
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
            placeholder="Cari nama atau email..."
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

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">Semua Role</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="FIELD">Field Worker</option>
        </select>
      </div>

      {/* Status Tabs (only for FIELD) */}
      {roleFilter === "all" || roleFilter === "FIELD" ? (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter("available")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === "available"
                ? "bg-green-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tersedia
            {availableWorkers > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === "available" ? "bg-white/20" : "bg-green-100 text-green-700"
              }`}>
                {availableWorkers}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter("busy")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === "busy"
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Sibuk
            {busyWorkers > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                statusFilter === "busy" ? "bg-white/20" : "bg-orange-100 text-orange-700"
              }`}>
                {busyWorkers}
              </span>
            )}
          </button>
        </div>
      ) : null}

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#64748B" }}>Memuat...</div>
        ) : filteredWorkers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              variant="workers"
              title={searchQuery || statusFilter !== "all" || roleFilter !== "all" ? "Tidak ada hasil" : "Belum ada worker"}
              description={searchQuery || statusFilter !== "all" || roleFilter !== "all" ? "Coba ubah filter pencarian" : "Tambahkan worker untuk mulai mengelola tim lapangan."}
              actionLabel={searchQuery || statusFilter !== "all" || roleFilter !== "all" ? undefined : "Tambah Worker"}
              onAction={searchQuery || statusFilter !== "all" || roleFilter !== "all" ? undefined : openCreateModal}
            />
          </div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Nama</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Job Saat Ini</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Total Selesai</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Telepon</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#F1F5F9" }}>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">{worker.name}</span>
                    <p className="text-xs text-slate-500">{worker.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColors[worker.role]}`}>
                      {roleLabels[worker.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {worker.role === "FIELD" ? (
                      worker.status === "BUSY" ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                          Sibuk
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Tersedia
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {worker.role === "FIELD" ? (
                      worker.currentJob ? (
                        <span className="text-slate-700 truncate max-w-32 block" title={worker.currentJob.title}>
                          {worker.currentJob.title}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {worker.role === "FIELD" ? (
                      <span className="font-semibold text-slate-700">{worker.completedJobs || 0}</span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {worker.phone ? (
                      <a
                        href={`https://wa.me/${worker.phone.replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-green-600 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {worker.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(worker)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        style={{ color: "#64748B" }}
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(worker)}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        style={{ color: "#EF4444" }}
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <WorkerFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchWorkers}
        worker={editingWorker}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Worker?"
        message={`Worker "${deleteTarget?.name}" akan dihapus. Data yang sudah dibuat oleh worker ini tidak akan hilang.`}
        confirmText="Hapus"
        type="danger"
        loading={deleting}
      />
    </div>
  );
}
