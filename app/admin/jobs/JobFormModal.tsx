"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import dynamic from "next/dynamic";

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center">
      <span className="text-sm" style={{ color: "#94A3B8" }}>Memuat peta...</span>
    </div>
  ),
});

interface AreaItem {
  label: string;
}

interface Area {
  name: string;
  items: AreaItem[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  areas: { id: string; name: string; items: { id: string; label: string }[] }[];
}

interface Worker {
  id: string;
  name: string;
  phone: string;
  status?: "AVAILABLE" | "BUSY";
  currentJob?: { id: string; title: string } | null;
}

interface Client {
  id: string;
  name: string;
}

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templates: Template[];
}

export default function JobFormModal({ isOpen, onClose, onSuccess, templates }: JobFormModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [fieldWorkers, setFieldWorkers] = useState<Worker[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    clientId: "",
    locationAddress: "",
    locationLat: null as number | null,
    locationLng: null as number | null,
    scheduledDate: "",
    scheduledTime: "08:00",
    notes: "",
    workerIds: [] as string[],
  });

  const [showMap, setShowMap] = useState(false);

  const [areas, setAreas] = useState<Area[]>([
    { name: "", items: [{ label: "" }] },
  ]);

  // Fetch clients and workers with status on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/clients").then((r) => r.json()),
      fetch("/api/admin/workers?role=FIELD&withStatus=true").then((r) => r.json()),
    ]).then(([clientsData, workersData]) => {
      if (Array.isArray(clientsData)) setClients(clientsData);
      if (Array.isArray(workersData)) setFieldWorkers(workersData);
    }).catch(() => {});
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      setForm({
        title: "",
        description: "",
        clientId: "",
        locationAddress: "",
        locationLat: null,
        locationLng: null,
        scheduledDate: today,
        scheduledTime: "08:00",
        notes: "",
        workerIds: [],
      });
      setAreas([{ name: "", items: [{ label: "" }] }]);
      setSelectedTemplate(null);
      setTemplateSearch("");
      setShowTemplateDropdown(false);
      setShowMap(false);
    }
  }, [isOpen]);

  // Filter templates based on search
  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Apply template
  function applyTemplate(template: Template) {
    setSelectedTemplate(template);
    setAreas(
      template.areas.map((a) => ({
        name: a.name,
        items: a.items.map((i) => ({ label: i.label })),
      }))
    );
    showToast(`Template "${template.name}" diterapkan`, "success");
  }

  function addArea() {
    setAreas([...areas, { name: "", items: [{ label: "" }] }]);
  }

  function removeArea(idx: number) {
    setAreas(areas.filter((_, i) => i !== idx));
  }

  function updateAreaName(idx: number, name: string) {
    const updated = [...areas];
    updated[idx].name = name;
    setAreas(updated);
  }

  function addItem(areaIdx: number) {
    const updated = [...areas];
    updated[areaIdx].items.push({ label: "" });
    setAreas(updated);
  }

  function updateItem(areaIdx: number, itemIdx: number, label: string) {
    const updated = [...areas];
    updated[areaIdx].items[itemIdx].label = label;
    setAreas(updated);
  }

  function removeItem(areaIdx: number, itemIdx: number) {
    const updated = [...areas];
    updated[areaIdx].items = updated[areaIdx].items.filter((_, i) => i !== itemIdx);
    setAreas(updated);
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      showToast("Judul job wajib diisi", "warning");
      return;
    }
    if (!form.clientId) {
      showToast("Klien wajib dipilih", "warning");
      return;
    }
    if (!form.locationAddress.trim()) {
      showToast("Alamat lokasi wajib diisi", "warning");
      return;
    }
    if (!form.scheduledDate) {
      showToast("Tanggal wajib diisi", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const validAreas = areas.filter((a) => a.name.trim() !== "");

      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          clientId: form.clientId,
          locationAddress: form.locationAddress,
          locationLat: form.locationLat ?? -7.2575,
          locationLng: form.locationLng ?? 112.7521,
          scheduledDate: form.scheduledDate,
          scheduledTime: form.scheduledTime,
          notes: form.notes,
          workerIds: form.workerIds,
          areas: validAreas,
        }),
      });

      if (res.ok) {
        showToast("Job berhasil dibuat", "success");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal membuat job", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSubmitting(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Job Baru</h2>
              <p className="text-sm mt-1" style={{ color: "#64748B" }}>Buat pekerjaan baru</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              style={{ color: "#64748B" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Job *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Cleaning Gedung Kantor Lt. 3"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detail pekerjaan atau instruksi khusus..."
                rows={2}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Klien *</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="">Pilih klien...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jam *</label>
                <input
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lokasi *</label>
              <AddressAutocomplete
                value={form.locationAddress}
                onChange={(address) => setForm((f) => ({ ...f, locationAddress: address }))}
                onLocationChange={(lat, lng) => setForm((f) => ({ ...f, locationLat: lat, locationLng: lng }))}
                placeholder="Ketik alamat, pilih dari saran..."
              />
              {(form.locationLat !== null || form.locationLng !== null) && (
                <p className="text-xs mt-1" style={{ color: "#16A34A" }}>
                  ✓ Lokasi tersimpan: {form.locationLat?.toFixed(6)}, {form.locationLng?.toFixed(6)}
                </p>
              )}
            </div>

            {/* Map Toggle */}
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-sm font-medium flex items-center gap-2 hover:underline"
              style={{ color: "#D97706" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              {showMap ? "Sembunyikan peta" : "Tampilkan peta"}
            </button>

            {/* Map */}
            {showMap && (
              <LocationPicker
                lat={form.locationLat}
                lng={form.locationLng}
                onLocationChange={(lat, lng) => setForm((f) => ({ ...f, locationLat: lat, locationLng: lng }))}
                address={form.locationAddress}
              />
            )}
          </div>

          {/* Workers */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tugaskan Worker</label>
            {fieldWorkers.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada worker lapangan.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {fieldWorkers.map((w) => {
                  const isBusy = w.status === "BUSY";
                  const isSelected = form.workerIds.includes(w.id);

                  return (
                    <label
                      key={w.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? "border-amber-500 bg-amber-50"
                          : isBusy
                          ? "border-slate-200 bg-slate-50 opacity-60"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isBusy && !isSelected}
                        onChange={(e) => {
                          if (isBusy && !isSelected) return;
                          if (e.target.checked) {
                            setForm({ ...form, workerIds: [...form.workerIds, w.id] });
                          } else {
                            setForm({ ...form, workerIds: form.workerIds.filter((id) => id !== w.id) });
                          }
                        }}
                        className="w-4 h-4 rounded mt-0.5"
                        style={{ accentColor: "#D97706" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isBusy ? "text-slate-400" : "text-slate-900"}`}>{w.name}</p>
                          {isBusy ? (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium whitespace-nowrap">
                              Sibuk
                            </span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 font-medium whitespace-nowrap">
                              Tersedia
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isBusy ? "text-red-400" : "text-slate-500"} truncate`}>
                          {isBusy ? w.currentJob?.title : w.phone}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Instruksi khusus atau catatan untuk worker..."
              rows={2}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
            />
          </div>

          {/* Areas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Area & Checklist</label>
              <button
                type="button"
                onClick={addArea}
                className="text-xs font-semibold text-amber-600 hover:underline"
              >
                + Tambah Area
              </button>
            </div>

            {/* Template selector - inside Area section */}
            <div className="mb-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white hover:bg-slate-50 transition-colors"
                >
                  <span style={{ color: selectedTemplate ? "#374151" : "#94A3B8" }}>
                    {selectedTemplate ? `${selectedTemplate.name} (${selectedTemplate.areas.length} area)` : "Pilih template (opsional)"}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showTemplateDropdown ? "rotate-180" : ""}`} style={{ color: "#64748B" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showTemplateDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg">
                    <div className="p-2 border-b border-slate-100">
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Cari template..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredTemplates.length === 0 ? (
                        <div className="px-4 py-3 text-sm" style={{ color: "#64748B" }}>
                          {templates.length === 0 ? "Tidak ada template" : "Template tidak ditemukan"}
                        </div>
                      ) : (
                        filteredTemplates.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              applyTemplate(t);
                              setShowTemplateDropdown(false);
                              setTemplateSearch("");
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                          >
                            <div className="text-sm font-medium text-slate-900">{t.name}</div>
                            <div className="text-xs" style={{ color: "#64748B" }}>
                              {t.areas.length} area • {t.areas.reduce((acc, a) => acc + a.items.length, 0)} checklist item
                            </div>
                            {t.description && (
                              <div className="text-xs truncate mt-0.5" style={{ color: "#94A3B8" }}>
                                {t.description}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedTemplate && (
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setAreas([{ name: "", items: [{ label: "" }] }]);
                  }}
                  className="text-xs mt-1 hover:underline"
                  style={{ color: "#64748B" }}
                >
                  Hapus template
                </button>
              )}
            </div>

            <div className="space-y-3">
              {areas.map((area, areaIdx) => (
                <div key={areaIdx} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={area.name}
                      onChange={(e) => updateAreaName(areaIdx, e.target.value)}
                      placeholder={`Nama area ${areaIdx + 1} (contoh: Lobby, Toilet)`}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                    {areas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArea(areaIdx)}
                        className="text-red-400 hover:text-red-600 px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {area.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex gap-2">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => updateItem(areaIdx, itemIdx, e.target.value)}
                          placeholder={`Tugas ${itemIdx + 1}`}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                        />
                        {area.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(areaIdx, itemIdx)}
                            className="text-slate-400 hover:text-red-500 px-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItem(areaIdx)}
                      className="text-xs font-medium text-amber-600 hover:underline"
                    >
                      + Tambah tugas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 btn-primary font-semibold rounded-xl disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Simpan Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
