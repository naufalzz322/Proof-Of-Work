"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import EmptyState from "@/components/EmptyState";
import ClientFormModal from "./ClientFormModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";

interface Client {
  id: string;
  slug: string;
  name: string;
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  _count?: { jobs: number };
}

export default function ClientsPage() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch {
      showToast("Gagal memuat klien", "error");
    }
    setLoading(false);
  }

  function openCreateModal() {
    setEditingClient(null);
    setShowModal(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);
    setShowModal(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/clients/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Klien dihapus", "success");
        setDeleteTarget(null);
        fetchClients();
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
  const totalClients = clients.length;
  const totalJobs = clients.reduce((sum, c) => sum + (c._count?.jobs || 0), 0);

  // Filter
  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.contactName.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query) ||
      c.contactEmail?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-8">
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">Klien</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {totalJobs} job dari {totalClients} klien
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Klien Baru
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{totalClients}</div>
          <div className="text-xs text-slate-500 mt-1">Total Klien</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{totalJobs}</div>
          <div className="text-xs text-slate-500 mt-1">Total Job</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {clients.filter((c) => (c._count?.jobs || 0) > 0).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Aktif</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
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
          placeholder="Cari nama klien, kontak, atau alamat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

      {/* List */}
      {loading ? (
        <div className="card p-8 text-center" style={{ color: "#64748B" }}>Memuat...</div>
      ) : filteredClients.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            variant="clients"
            title={searchQuery ? "Tidak ada hasil" : "Belum ada klien"}
            description={searchQuery ? "Coba ubah kata kunci pencarian" : "Tambahkan klien baru untuk mulai membuat job."}
            actionLabel={searchQuery ? undefined : "Tambah Klien"}
            onAction={searchQuery ? undefined : openCreateModal}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="card card-interactive p-5"
            >
              {/* Client icon + name */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FEF3C7" }}>
                  <svg className="w-5 h-5" style={{ color: "#D97706" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/clients/${client.slug}`} className="block font-semibold text-slate-900 truncate hover:underline" style={{ textDecorationColor: "#D97706" }}>
                    {client.name}
                  </Link>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#64748B" }}>
                    {client.contactName || "—"}
                    {client.contactTitle && ` · ${client.contactTitle}`}
                  </p>
                </div>
                {/* Job count badge */}
                {(client._count?.jobs || 0) > 0 && (
                  <span
                    className="px-2 py-0.5 text-xs font-bold rounded-full"
                    style={{ background: "#FEF3C7", color: "#D97706" }}
                  >
                    {client._count?.jobs} job
                  </span>
                )}
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 mb-4">
                {client.contactPhone && (
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "#64748B" }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {client.contactPhone}
                  </div>
                )}
                {client.contactEmail && (
                  <div
                    className="flex items-center gap-2 text-xs truncate"
                    style={{ color: "#64748B" }}
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <span className="truncate">{client.contactEmail}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: "#94A3B8" }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="line-clamp-2">{client.address}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                <Link
                  href={`/admin/clients/${client.slug}`}
                  className="text-xs font-medium text-amber-600 hover:underline"
                >
                  Lihat Detail →
                </Link>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(client)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    style={{ color: "#64748B" }}
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(client)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    style={{ color: "#EF4444" }}
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ClientFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchClients}
        client={editingClient}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Klien?"
        message={`Klien "${deleteTarget?.name}" akan dihapus. Job yang sudah dibuat tetap ada.`}
        confirmText="Hapus"
        type="danger"
        loading={deleting}
      />
    </div>
  );
}
