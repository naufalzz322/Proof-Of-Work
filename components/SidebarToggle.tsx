"use client";

import { useSidebar } from "./SidebarContext";

export default function SidebarToggle({ variant }: { variant: "admin" | "supervisor" }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <svg
        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
  );
}
