"use client";

import { useState, useEffect } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";
import Modal from "@/components/Modal";

interface TemplateArea {
  id: string;
  name: string;
  sortOrder: number;
  items: { id: string; label: string }[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  areas: TemplateArea[];
  createdAt: string;
}

export default function TemplatesPage() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    areas: [{ name: "", items: [{ label: "" }] }],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/admin/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch {
      showToast("Gagal memuat templates", "error");
    }
    setLoading(false);
  }

  function openCreateModal() {
    setForm({ name: "", description: "", areas: [{ name: "", items: [{ label: "" }] }] });
    setEditingTemplate(null);
    setShowCreateModal(true);
  }

  function openEditModal(template: Template) {
    setForm({
      name: template.name,
      description: template.description ?? "",
      areas: template.areas.map((a) => ({
        name: a.name,
        items: a.items.map((i) => ({ label: i.label })),
      })),
    });
    setEditingTemplate(template);
    setShowCreateModal(true);
  }

  function openDuplicateModal(template: Template) {
    setForm({
      name: `${template.name} (Copy)`,
      description: template.description ?? "",
      areas: template.areas.map((a) => ({
        name: a.name,
        items: a.items.map((i) => ({ label: i.label })),
      })),
    });
    setEditingTemplate(null);
    setShowCreateModal(true);
  }

  function addArea() {
    setForm((f) => ({
      ...f,
      areas: [...f.areas, { name: "", items: [{ label: "" }] }],
    }));
  }

  function removeArea(idx: number) {
    setForm((f) => ({ ...f, areas: f.areas.filter((_, i) => i !== idx) }));
  }

  function updateAreaName(idx: number, name: string) {
    setForm((f) => ({
      ...f,
      areas: f.areas.map((a, i) => (i === idx ? { ...a, name } : a)),
    }));
  }

  function addItem(areaIdx: number) {
    setForm((f) => ({
      ...f,
      areas: f.areas.map((a, i) =>
        i === areaIdx ? { ...a, items: [...a.items, { label: "" }] } : a
      ),
    }));
  }

  function removeItem(areaIdx: number, itemIdx: number) {
    setForm((f) => ({
      ...f,
      areas: f.areas.map((a, i) =>
        i === areaIdx ? { ...a, items: a.items.filter((_, j) => j !== itemIdx) } : a
      ),
    }));
  }

  function updateItemLabel(areaIdx: number, itemIdx: number, label: string) {
    setForm((f) => ({
      ...f,
      areas: f.areas.map((a, i) =>
        i === areaIdx
          ? { ...a, items: a.items.map((item, j) => (j === itemIdx ? { ...item, label } : item)) }
          : a
      ),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast("Nama template wajib diisi", "warning");
      return;
    }
    if (form.areas.length === 0 || form.areas.some((a) => !a.name.trim())) {
      showToast("Semua area wajib memiliki nama", "warning");
      return;
    }

    setSaving(true);
    try {
      const cleanAreas = form.areas.filter((a) => a.name.trim());
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        areas: cleanAreas.map((a) => ({
          name: a.name.trim(),
          items: a.items.filter((i) => i.label.trim()).map((i) => ({ label: i.label.trim() })),
        })),
      };

      const res = await fetch(
        editingTemplate ? `/api/admin/templates/${editingTemplate.id}` : "/api/admin/templates",
        {
          method: editingTemplate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        showToast(editingTemplate ? "Template berhasil diupdate" : "Template berhasil dibuat", "success");
        setShowCreateModal(false);
        fetchTemplates();
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Template dihapus", "success");
        setDeleteTarget(null);
        fetchTemplates();
      }
    } catch {
      showToast("Gagal menghapus", "error");
    }
    setSaving(false);
  }

  // Stats
  const totalTemplates = templates.length;
  const totalAreas = templates.reduce((sum, t) => sum + t.areas.length, 0);
  const totalItems = templates.reduce((sum, t) => sum + t.areas.reduce((a, area) => a + area.items.length, 0), 0);

  // Filter
  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.areas.some((a) => a.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Template Job</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {totalAreas} area · {totalItems} checklist item
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Template Baru
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{totalTemplates}</div>
          <div className="text-xs text-slate-500 mt-1">Total Template</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{totalAreas}</div>
          <div className="text-xs text-slate-500 mt-1">Total Area</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalItems}</div>
          <div className="text-xs text-slate-500 mt-1">Total Checklist</div>
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
          placeholder="Cari template atau area..."
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FEF3C7" }}>
            <svg className="w-6 h-6" style={{ color: "#D97706" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12z" />
            </svg>
          </div>
          <p className="font-medium text-slate-700 mb-2">
            {searchQuery ? "Tidak ada hasil" : "Belum ada template"}
          </p>
          <p className="text-sm" style={{ color: "#94A3B8" }}>
            {searchQuery ? "Coba ubah kata kunci pencarian" : "Buat template untuk mempercepat pembuatan job baru"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((t) => (
            <div key={t.id} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{t.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>
                      {t.areas.length} area
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E0F2FE", color: "#0369A1" }}>
                      {t.areas.reduce((sum, a) => sum + a.items.length, 0)} item
                    </span>
                  </div>
                </div>
              </div>

              {t.description && (
                <p className="text-sm mb-3 line-clamp-2" style={{ color: "#64748B" }}>{t.description}</p>
              )}

              {/* Area preview */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {t.areas.slice(0, 4).map((area) => (
                  <span
                    key={area.id}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: "#F8FAFC", color: "#475569" }}
                  >
                    {area.name} ({area.items.length})
                  </span>
                ))}
                {t.areas.length > 4 && (
                  <span className="text-xs px-2 py-1" style={{ color: "#94A3B8" }}>
                    +{t.areas.length - 4} more
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
                <span className="text-xs" style={{ color: "#94A3B8" }}>
                  {new Date(t.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openDuplicateModal(t)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    style={{ color: "#64748B" }}
                    title="Duplicate"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    style={{ color: "#64748B" }}
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
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
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={editingTemplate ? "Edit Template" : "Template Baru"}
          subtitle={editingTemplate ? `Edit ${editingTemplate.name}` : "Buat template baru"}
          maxWidth="2xl"
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary px-5 py-2.5 font-semibold rounded-xl disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Template"}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Template Info */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nama Template *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Contoh: Kantor Standard"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Deskripsi</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Kapan template ini digunakan"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Areas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700">Area & Checklist</label>
                <button onClick={addArea} className="text-xs font-semibold text-amber-600 hover:underline">
                  + Tambah Area
                </button>
              </div>
              <div className="space-y-4">
                {form.areas.map((area, areaIdx) => (
                  <div key={areaIdx} className="border border-slate-200 rounded-xl p-4">
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={area.name}
                        onChange={(e) => updateAreaName(areaIdx, e.target.value)}
                        placeholder="Nama area (contoh: Lobby)"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                      {form.areas.length > 1 && (
                        <button
                          onClick={() => removeArea(areaIdx)}
                          className="text-red-500 hover:bg-red-50 px-2 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {area.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex gap-2">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateItemLabel(areaIdx, itemIdx, e.target.value)}
                            placeholder="Checklist item"
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                          />
                          {area.items.length > 1 && (
                            <button
                              onClick={() => removeItem(areaIdx, itemIdx)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addItem(areaIdx)}
                        className="text-xs text-amber-600 font-medium hover:underline"
                      >
                        + Tambah Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Template?"
        message={`Template "${deleteTarget?.name}" akan dihapus. Area dan checklist di dalamnya tidak bisa dikembalikan.`}
        confirmText="Hapus"
        type="danger"
        loading={saving}
      />
    </div>
  );
}
