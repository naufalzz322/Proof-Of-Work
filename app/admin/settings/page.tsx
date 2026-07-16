"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Form states - pre-filled with user data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && data.id) {
          setUser(data);
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Profil berhasil diperbarui", "success");
        router.refresh();
        // Notify dropdown to refresh user data
        window.dispatchEvent(new Event("profile-updated"));
      } else {
        showToast(data.error || "Gagal memperbarui profil", "error");
      }
    } catch {
      showToast("Gagal menyimpan perubahan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("Password baru tidak cocok", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Password minimal 6 karakter", "error");
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Password berhasil diubah", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.error || "Gagal mengubah password", "error");
      }
    } catch {
      showToast("Gagal mengubah password", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-48 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pengaturan</h1>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Kelola profil dan password akun Anda</p>
      </div>

      {/* Profile Section */}
      <div className="card p-4 sm:p-5 mb-4 sm:mb-6">
        <h2 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3 sm:mb-4">Profil Saya</h2>

        <form onSubmit={handleSaveProfile} className="space-y-3 sm:space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100">
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0"
              style={{ background: "#D97706" }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 font-medium truncate">{name}</p>
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 mt-1">
                Admin
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="Masukkan email"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              No. WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 font-semibold rounded-xl text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#D97706" }}
          >
            {saving && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Simpan Perubahan
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="card p-4 sm:p-5">
        <h2 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-3 sm:mb-4">Ubah Password</h2>

        <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password Saat Ini
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="Masukkan password saat ini"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="Masukkan password baru (min. 6 karakter)"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              placeholder="Ulangi password baru"
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="w-full py-3 font-semibold rounded-xl text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#D97706" }}
          >
            {passwordSaving && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Ubah Password
          </button>
        </form>
      </div>
    </div>
  );
}
