"use client";

import Link from "next/link";

type EmptyStateVariant = "jobs" | "workers" | "clients" | "reports" | "checklist" | "photos" | "general";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: React.ReactNode;
  defaultTitle: string;
  defaultDescription: string;
  actionLabel: string;
  actionHref: string;
}> = {
  jobs: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    defaultTitle: "Belum ada pekerjaan",
    defaultDescription: "Tidak ada job yang terjadwal untuk saat ini.",
    actionLabel: "Hubungi Supervisor",
    actionHref: "#",
  },
  workers: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    defaultTitle: "Belum ada tim kerja",
    defaultDescription: "Tambahkan worker untuk mulai mengelola tim lapangan.",
    actionLabel: "Tambah Worker",
    actionHref: "/admin/workers/new",
  },
  clients: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    defaultTitle: "Belum ada klien",
    defaultDescription: "Tambahkan klien baru untuk mulai membuat job.",
    actionLabel: "Tambah Klien",
    actionHref: "/admin/clients/new",
  },
  reports: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    defaultTitle: "Belum ada laporan",
    defaultDescription: "Laporan akan muncul setelah job diselesaikan.",
    actionLabel: "Lihat Job",
    actionHref: "/admin/jobs",
  },
  checklist: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    defaultTitle: "Semua selesai!",
    defaultDescription: "Tidak ada item yang perlu dikerjakan di area ini.",
    actionLabel: "Kembali",
    actionHref: "/field/jobs",
  },
  photos: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    defaultTitle: "Belum ada foto",
    defaultDescription: "Ambil foto untuk mendokumentasikan area kerja.",
    actionLabel: "Ambil Foto",
    actionHref: "#",
  },
  general: {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    defaultTitle: "Tidak ada data",
    defaultDescription: "Data akan muncul setelah Anda mulai menggunakan fitur ini.",
    actionLabel: "Mulai",
    actionHref: "/",
  },
};

export default function EmptyState({
  variant = "general",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: EmptyStateProps) {
  const config = variantConfig[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "#FEF3C7" }}
      >
        <div style={{ color: "#D97706" }}>
          {icon || config.icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display font-semibold text-slate-900 text-lg">
        {title || config.defaultTitle}
      </h3>

      {/* Description */}
      <p className="text-slate-500 text-sm mt-1 max-w-sm">
        {description || config.defaultDescription}
      </p>

      {/* Action */}
      {(actionLabel || config.actionLabel) && (
        <div className="mt-6">
          {onAction ? (
            <button
              onClick={onAction}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              {actionLabel || config.actionLabel}
            </button>
          ) : (
            <Link
              href={actionHref || config.actionHref}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold inline-block"
            >
              {actionLabel || config.actionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// Simple rest icon variant for break/rest screens
export function RestEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "#DCFCE7" }}
      >
        <svg className="w-10 h-10" style={{ color: "#16A34A" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="font-display font-semibold text-slate-900 text-lg">
        Nikmati Waktu Istirahatmu
      </h3>
      <p className="text-slate-500 text-sm mt-2 max-w-xs">
        Tidak ada job terjadwal untuk saat ini. Istirahat yang cukup sebelum job berikutnya!
      </p>
    </div>
  );
}
