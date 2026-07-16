"use client";

import { useState, useEffect, useCallback } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";
import Modal from "@/components/Modal";

interface Client {
  id: string;
  name: string;
}

interface RecurringSchedule {
  id: string;
  clientId: string;
  client: Client;
  title: string;
  locationAddress: string;
  scheduledTime: string;
  recurrence: "DAILY" | "WEEKLY" | "MONTHLY";
  daysOfWeek: number[];
  dayOfMonth: number | null;
  isActive: boolean;
  createdAt: string;
}

const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RECURRENCE_LABELS = {
  DAILY: "Setiap hari",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
};

// Calculate next run date based on recurrence
function getNextRun(schedule: RecurringSchedule): Date | null {
  const now = new Date();
  const [hours, minutes] = schedule.scheduledTime.split(":").map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (schedule.recurrence === "DAILY") {
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  if (schedule.recurrence === "WEEKLY" && schedule.daysOfWeek.length > 0) {
    const sortedDays = [...schedule.daysOfWeek].sort((a, b) => a - b);
    const currentDay = now.getDay();

    // Find next day
    for (const day of sortedDays) {
      if (day > currentDay || (day === currentDay && next > now)) {
        const diff = day - currentDay;
        next.setDate(now.getDate() + diff);
        return next;
      }
    }
    // Wrap to next week
    const diff = 7 - currentDay + sortedDays[0];
    next.setDate(now.getDate() + diff);
    return next;
  }

  if (schedule.recurrence === "MONTHLY" && schedule.dayOfMonth) {
    const currentDate = now.getDate();
    const nextMonth = new Date(now);

    if (schedule.dayOfMonth > currentDate) {
      next.setDate(schedule.dayOfMonth);
    } else {
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      next.setMonth(nextMonth.getMonth());
      next.setDate(schedule.dayOfMonth);
    }
    return next;
  }

  return null;
}

function formatNextRun(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  return date.toLocaleDateString("id-ID", options);
}

export default function RecurringPage() {
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<RecurringSchedule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");

  const [form, setForm] = useState({
    clientId: "",
    title: "",
    locationAddress: "",
    scheduledTime: "08:00",
    recurrence: "WEEKLY" as "DAILY" | "WEEKLY" | "MONTHLY",
    daysOfWeek: [1] as number[],
    dayOfMonth: 1 as number | null,
  });

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/recurring");
      if (res.ok) setSchedules(await res.json());
    } catch {
      showToast("Gagal memuat jadwal", "error");
    }
    setLoading(false);
  }, [showToast]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clients");
      if (res.ok) setClients(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchClients();
  }, [fetchSchedules, fetchClients]);

  // Filter schedules when search or client filter changes
  useEffect(() => {
    let result = [...schedules];

    // Filter by client
    if (clientFilter !== "all") {
      result = result.filter((s) => s.clientId === clientFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.client.name.toLowerCase().includes(query) ||
          s.locationAddress.toLowerCase().includes(query)
      );
    }

    setFilteredSchedules(result);
  }, [schedules, searchQuery, clientFilter]);

  // Stats
  const stats = {
    total: schedules.length,
    active: schedules.filter((s) => s.isActive).length,
    inactive: schedules.filter((s) => !s.isActive).length,
  };

  function openCreateModal() {
    setForm({
      clientId: "",
      title: "",
      locationAddress: "",
      scheduledTime: "08:00",
      recurrence: "WEEKLY",
      daysOfWeek: [1],
      dayOfMonth: 1,
    });
    setEditingId(null);
    setShowModal(true);
  }

  function openEditModal(s: RecurringSchedule) {
    setForm({
      clientId: s.clientId,
      title: s.title,
      locationAddress: s.locationAddress,
      scheduledTime: s.scheduledTime,
      recurrence: s.recurrence,
      daysOfWeek: s.daysOfWeek,
      dayOfMonth: s.dayOfMonth,
    });
    setEditingId(s.id);
    setShowModal(true);
  }

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(day)
        ? f.daysOfWeek.filter((d) => d !== day)
        : [...f.daysOfWeek, day].sort(),
    }));
  }

  async function handleToggleActive(schedule: RecurringSchedule) {
    setTogglingId(schedule.id);
    try {
      const res = await fetch(`/api/admin/recurring/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !schedule.isActive }),
      });

      if (res.ok) {
        showToast(
          schedule.isActive ? "Jadwal dinonaktifkan" : "Jadwal diaktifkan",
          "success"
        );
        fetchSchedules();
      } else {
        showToast("Gagal mengubah status", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setTogglingId(null);
  }

  async function handleSave() {
    if (!form.clientId || !form.title.trim()) {
      showToast("Klien dan judul wajib diisi", "warning");
      return;
    }
    if (form.recurrence === "WEEKLY" && form.daysOfWeek.length === 0) {
      showToast("Pilih minimal 1 hari", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        clientId: form.clientId,
        title: form.title.trim(),
        locationAddress: form.locationAddress.trim(),
        scheduledTime: form.scheduledTime,
        recurrence: form.recurrence,
        daysOfWeek: form.recurrence === "WEEKLY" ? form.daysOfWeek : [],
        dayOfMonth: form.recurrence === "MONTHLY" ? form.dayOfMonth : null,
      };

      const res = await fetch(
        editingId ? `/api/admin/recurring/${editingId}` : "/api/admin/recurring",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        showToast("Jadwal berhasil disimpan", "success");
        setShowModal(false);
        fetchSchedules();
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
      const res = await fetch(`/api/admin/recurring/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Jadwal dihapus", "success");
        setDeleteTarget(null);
        fetchSchedules();
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menghapus", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSaving(false);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Jadwal Otomatis</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {stats.active} jadwal aktif
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Jadwal Baru
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-sm" style={{ color: "#64748B" }}>Total Jadwal</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold" style={{ color: "#16A34A" }}>{stats.active}</div>
          <div className="text-sm" style={{ color: "#64748B" }}>Aktif</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold" style={{ color: "#64748B" }}>{stats.inactive}</div>
          <div className="text-sm" style={{ color: "#64748B" }}>Nonaktif</div>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "#94A3B8" }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
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
            placeholder="Cari jadwal atau klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
          />
        </div>

        {/* Client Filter */}
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent min-w-[180px]"
        >
          <option value="all">Semua Klien</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="card p-12 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#FEF3C7" }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: "#D97706" }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </div>
          <p className="font-medium text-slate-700 mb-2">
            {searchQuery || clientFilter !== "all"
              ? "Tidak ada jadwal yang cocok"
              : "Belum ada jadwal otomatis"}
          </p>
          <p className="text-sm mb-4" style={{ color: "#94A3B8" }}>
            {searchQuery || clientFilter !== "all"
              ? "Coba ubah kata kunci atau filter"
              : "Buat jadwal untuk auto-generate job secara berkala"}
          </p>
          {!searchQuery && clientFilter === "all" && (
            <button
              onClick={openCreateModal}
              className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Buat Jadwal Baru
            </button>
          )}
          {(searchQuery || clientFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setClientFilter("all");
              }}
              className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchedules.map((s) => {
            const nextRun = getNextRun(s);
            return (
              <div key={s.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Title and Status Toggle */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{s.title}</h3>
                      <button
                        onClick={() => handleToggleActive(s)}
                        disabled={togglingId === s.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2 ${
                          s.isActive ? "bg-green-500" : "bg-slate-300"
                        }`}
                        style={{ opacity: togglingId === s.id ? 0.5 : 1 }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            s.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: s.isActive ? "#DCFCE7" : "#F1F5F9",
                          color: s.isActive ? "#16A34A" : "#64748B",
                        }}
                      >
                        {s.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>

                    {/* Client */}
                    <p className="text-sm mb-3" style={{ color: "#64748B" }}>
                      {s.client.name}
                    </p>

                    {/* Schedule Info */}
                    <div className="flex items-center gap-4 mb-3">
                      {/* Time */}
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: "#64748B" }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {s.scheduledTime}
                      </div>

                      {/* Location */}
                      {s.locationAddress && (
                        <div className="flex items-center gap-1.5 text-sm truncate max-w-[200px]" style={{ color: "#64748B" }}>
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span className="truncate">{s.locationAddress}</span>
                        </div>
                      )}
                    </div>

                    {/* Visual Days / Date Display */}
                    <div className="mb-3">
                      {s.recurrence === "DAILY" && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Setiap hari
                        </span>
                      )}
                      {s.recurrence === "WEEKLY" && (
                        <div className="flex gap-1">
                          {DAYS_SHORT.map((day, idx) => {
                            const isActive = s.daysOfWeek.includes(idx);
                            return (
                              <div
                                key={idx}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                                  isActive
                                    ? "bg-amber-600 text-white"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                                title={DAYS_SHORT_EN[idx]}
                              >
                                {day.substring(0, 1)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {s.recurrence === "MONTHLY" && s.dayOfMonth && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          Tanggal {s.dayOfMonth} tiap bulan
                        </span>
                      )}
                    </div>

                    {/* Next Run Preview */}
                    {nextRun && s.isActive && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#16A34A" }}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span>Jadwal berikutnya: {formatNextRun(nextRun)} @ {s.scheduledTime}</span>
                      </div>
                    )}
                    {!s.isActive && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#94A3B8" }}>
                        Jadwal tidak aktif
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      style={{ color: "#64748B" }}
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors"
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
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingId ? "Edit Jadwal" : "Jadwal Otomatis Baru"}
          subtitle={editingId ? "Edit jadwal otomatis" : "Buat jadwal untuk auto-generate job"}
          maxWidth="lg"
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary px-5 py-2.5 font-semibold rounded-xl disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Klien *</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="">Pilih klien</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Job *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Contoh: Pembersihan Rutin Kantor"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
              <input
                type="text"
                value={form.locationAddress}
                onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))}
                placeholder="Alamat lokasi"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Waktu</label>
              <input
                type="time"
                value={form.scheduledTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* Recurrence Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Frekuensi</label>
              <div className="flex gap-2">
                {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm((f) => ({ ...f, recurrence: type }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.recurrence === type
                        ? "bg-amber-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {RECURRENCE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Days of Week (for WEEKLY) */}
            {form.recurrence === "WEEKLY" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hari</label>
                <div className="flex gap-2">
                  {DAYS_SHORT.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        form.daysOfWeek.includes(idx)
                          ? "bg-amber-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Day of Month (for MONTHLY) */}
            {form.recurrence === "MONTHLY" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <select
                  value={form.dayOfMonth ?? 1}
                  onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: Number(e.target.value) }))}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Jadwal?"
        message={`Jadwal "${deleteTarget?.title}" akan dihapus. Job yang sudah dibuat dari jadwal ini tidak terpengaruh.`}
        confirmText="Hapus"
        type="danger"
        loading={saving}
      />
    </div>
  );
}
