"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "ASSIGNED", label: "Ditugaskan" },
  { value: "IN_PROGRESS", label: "Berjalan" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "INVOICED", label: "Invoiced" },
];

export default function JobsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");

  function apply(q: string, s: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (s) params.set("status", s);
    const query = params.toString();
    startTransition(() => {
      router.push(`/admin/jobs${query ? `?${query}` : ""}`);
    });
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    apply(val, status);
  }

  function handleStatusChange(val: string) {
    setStatus(val);
    apply(search, val);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4"
            style={{ color: "#94A3B8" }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cari job, klien, atau nomor job..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400"
          style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
        />
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="px-4 py-2.5 rounded-xl border text-sm text-slate-700"
        style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
