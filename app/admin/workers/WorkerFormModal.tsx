"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import Modal from "@/components/Modal";

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "SUPERVISOR" | "FIELD";
}

interface WorkerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  worker?: Worker | null;
}

export default function WorkerFormModal({ isOpen, onClose, onSuccess, worker }: WorkerFormProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "FIELD" as "ADMIN" | "SUPERVISOR" | "FIELD",
    password: "",
  });

  useEffect(() => {
    if (worker) {
      setForm({
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        role: worker.role,
        password: "",
      });
    } else {
      setForm({ name: "", email: "", phone: "", role: "FIELD", password: "" });
    }
  }, [worker, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      showToast("Nama dan email wajib diisi", "warning");
      return;
    }

    if (!worker && !form.password.trim()) {
      showToast("Password wajib diisi untuk worker baru", "warning");
      return;
    }

    if (form.password && form.password.length < 6) {
      showToast("Password minimal 6 karakter", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
      };

      if (form.password) {
        payload.password = form.password;
      }

      const url = worker ? `/api/admin/workers/${worker.id}` : "/api/admin/workers";
      const method = worker ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(worker ? "Worker berhasil diupdate" : "Worker berhasil dibuat", "success");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSaving(false);
  }

  const roleOptions = [
    { value: "FIELD", label: "Field Worker", desc: "Tim lapangan" },
    { value: "SUPERVISOR", label: "Supervisor", desc: "Pengawas tim" },
    { value: "ADMIN", label: "Admin", desc: "Pengelola sistem" },
  ];

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex-1 btn-primary px-5 py-2.5 font-semibold rounded-xl disabled:opacity-50"
        onClick={handleSubmit as any}
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={worker ? "Edit Worker" : "Worker Baru"}
      subtitle={worker ? `Edit data ${worker.name}` : "Tambah worker baru ke tim"}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama lengkap"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@perusahaan.com"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="08xxxxxxxxxx"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
          <div className="grid grid-cols-3 gap-2">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, role: opt.value as any })}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  form.role === opt.value
                    ? "border-amber-600 bg-amber-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-sm font-semibold" style={{ color: form.role === opt.value ? "#D97706" : "#374151" }}>
                  {opt.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password {worker ? "(kosongkan jika tidak diubah)" : "*"}
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={worker ? "••••••••" : "Minimal 6 karakter"}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>
      </form>
    </Modal>
  );
}
