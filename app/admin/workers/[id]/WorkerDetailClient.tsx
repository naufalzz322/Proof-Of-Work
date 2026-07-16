"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import Breadcrumb from "@/components/Breadcrumb";

interface WorkerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function WorkerDetailClient({ worker }: { worker: WorkerData }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: worker.name,
    phone: worker.phone,
    role: worker.role,
    password: "",
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const body: Record<string, string> = { name: form.name, phone: form.phone, role: form.role };
    if (form.password) body.password = form.password;

    const res = await fetch(`/api/admin/workers/${worker.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated = await res.json();
      setForm(f => ({ ...f, name: updated.name, phone: updated.phone, role: updated.role, password: "" }));
      setEditing(false);
      showToast("Worker berhasil diperbarui!", "success");
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
      showToast(data.error ?? "Gagal menyimpan data", "error");
    }
    setSaving(false);
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    SUPERVISOR: "bg-amber-50 text-amber-700",
    FIELD: "bg-green-100 text-green-700",
  };
  const roleLabels: Record<string, string> = {
    ADMIN: "Admin",
    SUPERVISOR: "Supervisor",
    FIELD: "Field Worker",
  };

  return (
    <div className="p-6 max-w-xl">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Tim Kerja", href: "/admin/workers" },
          { label: worker.name },
        ]}
        showHome={false}
      />

      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/workers" className="text-slate-400 hover:text-slate-600">← Worker</Link>
        <h1 className="text-2xl font-bold text-slate-900">{worker.name}</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 flex-1">Informasi Worker</h2>
          <button onClick={() => setEditing(e => !e)} className="text-sm border border-slate-300 text-slate-700 px-4 py-1.5 rounded-xl hover:bg-slate-50 font-medium ml-4">
            {editing ? "Batal" : "Edit"}
          </button>
        </div>

        {!editing ? (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-500">Nama</dt><dd className="font-medium text-slate-900 mt-0.5">{worker.name}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900 mt-0.5">{worker.email}</dd></div>
            <div><dt className="text-slate-500">Telepon</dt><dd className="font-medium text-slate-900 mt-0.5">{worker.phone}</dd></div>
            <div>
              <dt className="text-slate-500">Role</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColors[worker.role]}`}>
                  {roleLabels[worker.role]}
                </span>
              </dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
              <input type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600">
                <option value="FIELD">Field Worker</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reset Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Kosongkan jika tidak diubah" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
              <p className="text-xs text-slate-500 mt-1">Kosongkan jika tidak ingin mengubah password</p>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full py-3 btn-primary font-semibold rounded-xl disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
