"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email atau password salah");
      setLoading(false);
    } else {
      // Fetch session to get role for proper redirect
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      // Redirect based on role
      if (session?.user?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (session?.user?.role === "SUPERVISOR") {
        router.push("/supervisor/dashboard");
      } else {
        router.push("/field/jobs");
      }
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0F172A" }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#0F172A", width: "42%" }}
      >
        {/* Subtle background grid pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#FFFFFF 1px, transparent 1px), linear-gradient(90deg, #FFFFFF 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10">
          {/* Shield icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: "#D97706" }}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="font-display font-extrabold text-5xl text-white leading-tight tracking-tight mb-4">
            Proof<br />
            of Work
          </h1>
          <p className="text-lg mb-2" style={{ color: "#94A3B8" }}>
            Dokumentasi kerja lapangan<br />
            dengan GPS, foto, dan tanda tangan.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-5">
          {[
            {
              label: "Verifikasi lokasi GPS",
              desc: "Geofence memastikan worker ada di lokasi",
            },
            {
              label: "Foto area kerja",
              desc: "Bukti visual setiap area yang dikerjakan",
            },
            {
              label: "Checklist digital",
              desc: "Standar kerja terpantau per area",
            },
          ].map((f) => (
            <div key={f.label} className="flex items-start gap-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(217, 119, 6, 0.15)" }}
              >
                <svg
                  className="w-4 h-4"
                  style={{ color: "#D97706" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{f.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}

          {/* Divider */}
          <div className="pt-2" style={{ borderTop: "1px solid #1E293B" }}>
            <p className="text-xs" style={{ color: "#475569" }}>
              Digunakan oleh tim cleaning & event organizer
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: "#F8FAFC" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#D97706" }}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-slate-900">
              Proof of Work
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
              Masuk
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#64748B" }}>
              Gunakan akun yang telah didaftarkan.
            </p>
          </div>

          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                background: "#FEF2F2",
                color: "#B91C1C",
                border: "1px solid #FECACA",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                required
                className="w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder-slate-400"
                style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder-slate-400"
                style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          {/* Demo credentials */}
          <div
            className="mt-8 p-4 rounded-xl"
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
            }}
          >
            <p
              className="text-xs font-semibold mb-3 uppercase tracking-wide"
              style={{ color: "#92400E" }}
            >
              Demo Akun
            </p>
            <div className="space-y-3">
              {[
                { role: "Admin", email: "admin@pytagotech.com", pass: "admin123" },
                { role: "Supervisor", email: "supervisor@pytagotech.com", pass: "admin123" },
                { role: "Field", email: "budi@field.com", pass: "field123" },
              ].map((c) => (
                <div key={c.role} className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "#78350F" }}>
                    {c.role}
                  </span>
                  <div className="text-xs font-mono" style={{ color: "#92400E" }}>
                    {c.email} / {c.pass}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
