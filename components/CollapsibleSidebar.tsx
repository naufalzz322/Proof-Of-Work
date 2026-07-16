"use client";

import { useSidebar } from "./SidebarContext";
import SidebarToggle from "./SidebarToggle";

interface CollapsibleSidebarProps {
  variant: "admin" | "supervisor";
  logo?: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function CollapsibleSidebar({
  variant,
  subtitle,
  children,
  footer,
}: CollapsibleSidebarProps) {
  const { collapsed } = useSidebar();

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-screen sticky top-0 transition-all duration-300"
      style={{
        background: "#0F172A",
        width: collapsed ? "64px" : "256px",
      }}
    >
      {/* Logo */}
      <div
        className="px-4 py-4 overflow-hidden"
        style={{ borderBottom: "1px solid #1E293B" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#D97706" }}
            >
              <svg
                className="w-5 h-5 text-white"
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
            {!collapsed && (
              <span className="font-display font-bold text-lg text-white leading-tight tracking-tight whitespace-nowrap">
                Proof of Work
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SidebarToggle variant={variant} />
          </div>
        </div>
        {!collapsed && (
          <p className="text-xs mt-1" style={{ color: "#64748B" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Nav */}
      {children}

      {/* Footer */}
      <div className="mt-auto" style={{ borderTop: "1px solid #1E293B" }}>
        {footer}
      </div>
    </aside>
  );
}
