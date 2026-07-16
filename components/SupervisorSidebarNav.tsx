"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useNotifications } from "./useNotifications";
import { useState, useEffect, useCallback } from "react";

const NAV_ITEMS = [
  {
    href: "/supervisor/dashboard",
    label: "Monitoring",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-2.25 0h-2.25m-2.25 0H8.25m0 0V5.625c0-.621-.504-1.125-1.125-1.125H5.625c-.621 0-1.125.504-1.125 1.125v13.5m14.25 0V5.625c0-.621-.504-1.125-1.125-1.125H5.625c-.621 0-1.125.504-1.125 1.125v13.5m-6.75-5.625v1.125m1.5-1.125v1.125m1.5 1.125v1.125m-4.5 0H8.25m0 0h1.5m-1.5 0h.75m-3.75 0h3.75" />
      </svg>
    ),
  },
  {
    href: "/supervisor/jobs",
    label: "Pekerjaan",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    href: "/supervisor/notifications",
    label: "Notifikasi",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
];

export default function SupervisorSidebarNav() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  const { isConnected } = useNotifications({
    onUnreadCountChange: handleUnreadCount,
  });

  // Fetch initial unread count
  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <nav className="px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/supervisor/dashboard"
            ? pathname === "/supervisor/dashboard"
            : pathname.startsWith(item.href);

        // Special handling for Notifications item
        const isNotifications = item.href === "/supervisor/notifications";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
              isActive ? "active" : "",
              collapsed ? "justify-center" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className={isActive ? "text-amber-400" : "text-slate-400"}>
              {item.icon}
            </span>
            {!collapsed && (
              <div className="flex items-center gap-2 flex-1">
                <span>{item.label}</span>
                {isNotifications && unreadCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-xs font-bold rounded-full min-w-[20px] text-center ${
                      isActive
                        ? "bg-amber-400 text-amber-900"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
