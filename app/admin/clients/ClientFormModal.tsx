"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import Modal from "@/components/Modal";

interface Client {
  id: string;
  name: string;
  contactName: string;
  contactTitle: string | null;
  contactPhone: string;
  contactEmail: string | null;
  address: string;
}

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client | null;
}

export default function ClientFormModal({ isOpen, onClose, onSuccess, client }: ClientFormModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    contactTitle: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
  });

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        contactName: client.contactName || "",
        contactTitle: client.contactTitle || "",
        contactPhone: client.contactPhone || "",
        contactEmail: client.contactEmail || "",
        address: client.address || "",
      });
    } else {
      setForm({
        name: "",
        contactName: "",
        contactTitle: "",
        contactPhone: "",
        contactEmail: "",
        address: "",
      });
    }
  }, [client, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("Nama klien wajib diisi", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        contactTitle: form.contactTitle.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        address: form.address.trim(),
      };

      const url = client ? `/api/admin/clients/${client.id}` : "/api/admin/clients";
      const method = client ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(client ? "Klien berhasil diupdate" : "Klien berhasil dibuat", "success");
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
      title={client ? "Edit Klien" : "Klien Baru"}
      subtitle={client ? `Edit data ${client.name}` : "Tambah klien baru"}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nama Klien *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="PT Maju Bersama"
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama PIC</label>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              placeholder="Budi Santoso"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jabatan</label>
            <input
              type="text"
              value={form.contactTitle}
              onChange={(e) => setForm({ ...form, contactTitle: e.target.value })}
              placeholder="Facility Manager"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telepon PIC</label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="081234567890"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email PIC</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="budi@perusahaan.com"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Jl. Sudirman No. 123, Jakarta"
            rows={2}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
