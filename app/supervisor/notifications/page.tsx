"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import Breadcrumb from "@/components/Breadcrumb";
import { useToast } from "@/components/Toast";
import { useNotifications } from "@/components/useNotifications";

type NotificationType =
  | "WORKER_CHECKIN"
  | "JOB_ASSIGNED"
  | "JOB_COMPLETED"
  | "CLIENT_SIGNED"
  | "JOB_OVERDUE"
  | "REPORT_SENT";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  jobId: string | null;
  jobSlug: string | null;
  jobNumber: string | null;
  isRead: boolean;
  sentVia: string[];
  createdAt: string;
}

interface GroupedNotifications {
  date: string;
  label: string;
  notifications: Notification[];
}

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: ReactNode; color: string; bgColor: string }
> = {
  WORKER_CHECKIN: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    color: "#0284C7",
    bgColor: "#E0F2FE",
  },
  JOB_ASSIGNED: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: "#F59E0B",
    bgColor: "#FEF3C7",
  },
  JOB_COMPLETED: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "#16A34A",
    bgColor: "#DCFCE7",
  },
  CLIENT_SIGNED: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    color: "#7C3AED",
    bgColor: "#EDE9FE",
  },
  JOB_OVERDUE: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  REPORT_SENT: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    color: "#EA580C",
    bgColor: "#FED7AA",
  },
};

// Toast component for real-time notifications
function RealtimeToast({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.REPORT_SENT;

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-slide-in-right"
      style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        border: `1px solid ${config.bgColor}`,
        overflow: "hidden",
        maxWidth: "360px",
      }}
    >
      <div className="h-1" style={{ background: config.color }} />
      <div className="p-4 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase" style={{ color: config.color }}>
              Baru
            </span>
          </div>
          <p className="font-semibold text-slate-900 text-sm mt-0.5">{notification.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{notification.message}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function SupervisorNotificationsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);
  const [confirmClearRead, setConfirmClearRead] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNewNotification = useCallback((notification: any) => {
    setNotifications((prev) => [notification as Notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    setNewNotification(notification as Notification);
  }, []);

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  useNotifications({
    onNewNotification: handleNewNotification,
    onUnreadCountChange: handleUnreadCountChange,
  });

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      showToast("Gagal memuat notifikasi", "error");
    }
    setLoading(false);
  }

  async function markAsRead(id: string) {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }

  async function markAllAsRead() {
    setConfirmMarkAll(false);
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", notificationId: "all" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast("Semua notifikasi ditandai sudah dibaca", "success");
    } catch {
      showToast("Gagal menandai notifikasi", "error");
    }
  }

  async function clearReadNotifications() {
    setConfirmClearRead(false);
    setClearing(true);
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clearRead" }),
      });
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      showToast("Notifikasi terbaca dihapus", "success");
    } catch {
      showToast("Gagal menghapus", "error");
    }
    setClearing(false);
  }

  async function handleDelete(id: string) {
    try {
      await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Notifikasi dihapus", "success");
      setDeleteTarget(null);
    } catch {
      showToast("Gagal menghapus", "error");
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getDateGroup(dateStr: string): { date: string; label: string } {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (notificationDate.getTime() === today.getTime()) {
      return { date: "today", label: "Hari Ini" };
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      return { date: "yesterday", label: "Kemarin" };
    } else if (notificationDate.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
      return { date: "thisWeek", label: "7 Hari Terakhir" };
    } else {
      return { date: "older", label: date.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) };
    }
  }

  function groupNotifications(notifs: Notification[]): GroupedNotifications[] {
    const groups: Record<string, Notification[]> = {};
    notifs.forEach((n) => {
      const { date } = getDateGroup(n.createdAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(n);
    });
    const order = ["today", "yesterday", "thisWeek", "older"];
    return Object.entries(groups)
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([date, notifs]) => {
        const { label } = getDateGroup(notifs[0].createdAt);
        return { date, label, notifications: notifs };
      });
  }

  // Apply filters
  const filteredNotifications = notifications.filter((n) => {
    if (typeFilter !== "all") {
      if (n.type !== typeFilter) return false;
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const notifDate = new Date(n.createdAt);
      if (notifDate < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      const notifDate = new Date(n.createdAt);
      if (notifDate > toDate) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        (n.jobNumber && n.jobNumber.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const displayedNotifications =
    filter === "unread"
      ? filteredNotifications.filter((n) => !n.isRead)
      : filteredNotifications;

  const groupedNotifications = groupNotifications(displayedNotifications);

  const handleCardClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.jobSlug) {
      router.push(`/supervisor/jobs/${notification.jobSlug}`);
    }
  };

  const totalCount = notifications.length;
  const todayCount = notifications.filter((n) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Real-time Toast */}
      {newNotification && (
        <RealtimeToast
          notification={newNotification}
          onClose={() => setNewNotification(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">
            Notifikasi
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => setConfirmMarkAll(true)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tandai Semua Dibaca
            </button>
          )}
          {notifications.some((n) => n.isRead) && (
            <button
              onClick={() => setConfirmClearRead(true)}
              disabled={clearing}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {clearing ? "Menghapus..." : "Hapus Terbaca"}
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="text-xs text-slate-500 mt-1">Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{unreadCount}</div>
          <div className="text-xs text-slate-500 mt-1">Belum Dibaca</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{todayCount}</div>
          <div className="text-xs text-slate-500 mt-1">Hari Ini</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Cari job number atau pesan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NotificationType | "all")}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">Semua Tipe</option>
          <option value="JOB_ASSIGNED">Job Ditugaskan</option>
          <option value="WORKER_CHECKIN">Worker Check-in</option>
          <option value="JOB_COMPLETED">Job Completed</option>
          <option value="CLIENT_SIGNED">Client Signed</option>
          <option value="JOB_OVERDUE">Job Overdue</option>
          <option value="REPORT_SENT">Report Sent</option>
        </select>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Dari"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-slate-400 text-sm">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Sampai"
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="p-2 text-slate-400 hover:text-slate-600"
              title="Clear date filter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === "all" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
            filter === "unread" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Belum Dibaca
          {unreadCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === "unread" ? "bg-white/20 text-white" : "bg-red-500 text-white"
            }`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#F1F5F9" }}>
            <svg className="w-10 h-10" style={{ color: "#94A3B8" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {searchQuery || typeFilter !== "all" ? "Tidak ada hasil" : filter === "unread" ? "Tidak ada notifikasi baru" : "Belum ada notifikasi"}
          </h3>
          <p className="text-sm" style={{ color: "#94A3B8" }}>
            {searchQuery || typeFilter !== "all" || dateFrom || dateTo
              ? "Coba ubah filter pencarian"
              : filter === "unread" ? "Semua notifikasi sudah dibaca" : "Notifikasi akan muncul saat ada aktivitas job"}
          </p>
          {(searchQuery || typeFilter !== "all" || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearchQuery(""); setTypeFilter("all"); setDateFrom(""); setDateTo(""); }}
              className="mt-4 px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-slate-500">{group.label}</span>
                <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
                <span className="text-xs text-slate-400">{group.notifications.length} notifikasi</span>
              </div>

              {/* Notification Cards */}
              <div className="space-y-3">
                {group.notifications.map((n) => {
                  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.REPORT_SENT;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleCardClick(n)}
                      className={`card p-4 transition-all cursor-pointer group ${!n.isRead ? "border-l-4" : ""} hover:shadow-md`}
                      style={{ borderLeftColor: !n.isRead ? config.color : undefined }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: config.bgColor, color: config.color }}
                        >
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold ${!n.isRead ? "text-slate-900" : "text-slate-700"}`}>
                                  {n.title}
                                </h3>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: config.color }} />
                                )}
                              </div>
                              <p className="text-sm" style={{ color: "#64748B" }}>
                                {n.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs" style={{ color: "#94A3B8" }}>
                                  {formatDate(n.createdAt)}
                                </span>
                                {n.jobNumber && (
                                  <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#D97706" }}>
                                    {n.jobNumber}
                                  </span>
                                )}
                                {n.sentVia.length > 0 && (
                                  <div className="flex gap-1">
                                    {n.sentVia.includes("WHATSAPP") && (
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                                        style={{ background: "#F0FDF4", color: "#16A34A" }}
                                        title="Via WhatsApp"
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                        WA
                                      </span>
                                    )}
                                    {n.sentVia.includes("EMAIL") && (
                                      <span
                                        className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                                        style={{ background: "#EFF6FF", color: "#2563EB" }}
                                        title="Via Email"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                        Email
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons - Visible on hover */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              {!n.isRead && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                  style={{ color: "#94A3B8" }}
                                  title="Tandai sudah dibaca"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(n); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                style={{ color: "#EF4444" }}
                                title="Hapus"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        title="Hapus Notifikasi?"
        message={`Notifikasi "${deleteTarget?.title}" akan dihapus.`}
        confirmText="Hapus"
        type="danger"
        loading={false}
      />

      {/* Mark All Read Confirmation */}
      <ConfirmModal
        isOpen={confirmMarkAll}
        onClose={() => setConfirmMarkAll(false)}
        onConfirm={markAllAsRead}
        title="Tandai Semua Dibaca?"
        message="Semua notifikasi akan ditandai sudah dibaca."
        confirmText="Ya, Tandai Semua"
        type="info"
        loading={false}
      />

      {/* Clear Read Notifications Confirmation */}
      <ConfirmModal
        isOpen={confirmClearRead}
        onClose={() => setConfirmClearRead(false)}
        onConfirm={clearReadNotifications}
        title="Hapus Notifikasi Terbaca?"
        message="Semua notifikasi yang sudah dibaca akan dihapus. Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, Hapus Semua"
        type="danger"
        loading={clearing}
      />
    </div>
  );
}
