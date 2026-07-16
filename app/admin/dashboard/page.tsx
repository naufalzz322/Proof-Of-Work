export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import Breadcrumb from "@/components/Breadcrumb";
import { AdminJobListSkeleton, StatsGridSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import DashboardJobSection from "./DashboardJobSection";

export default async function AdminDashboardPage() {
  const session = await auth();

  const [todayJobs, activeWorkers, pendingReports] = await Promise.all([
    prisma.job.findMany({
      where: {
        scheduledDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      select: { id: true, slug: true, title: true, jobNumber: true, scheduledTime: true, status: true, client: { select: { name: true } }, workers: { include: { worker: true } } },
      orderBy: { scheduledTime: "asc" },
    }),
    prisma.workSession.count({
      where: { checkInAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.job.count({ where: { status: "COMPLETED", report: null } }),
  ]);

  const stats = {
    todayJobs: todayJobs.length,
    inProgress: todayJobs.filter((j) => j.status === "IN_PROGRESS").length,
    activeWorkers,
    pendingReports,
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
          Selamat datang, {session?.user.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="Job Hari Ini" value={stats.todayJobs} icon="clipboard" accent="amber" />
        <StatCard label="Sedang Berjalan" value={stats.inProgress} icon="refresh" accent="sky" />
        <StatCard label="Worker Aktif" value={stats.activeWorkers} icon="users" accent="green" />
        <StatCard label="Pending Laporan" value={stats.pendingReports} icon="document" accent="red" />
      </div>

      {/* Today's jobs */}
      <div className="card overflow-hidden">
        <DashboardJobSection />

        {todayJobs.length === 0 ? (
          <EmptyState
            variant="jobs"
            title="Belum ada job untuk hari ini"
            description="Buat job baru untuk memulainya."
            actionLabel="Buat Job Baru"
            actionHref="/admin/jobs"
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Job</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Klien</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Jam</th>
                <th className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayJobs.map((job) => (
                <tr key={job.id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: "#F1F5F9" }}>
                  <td className="px-6 py-4">
                    <Link href={`/admin/jobs/${job.slug}`} className="font-semibold text-slate-900 hover:underline" style={{ textDecorationColor: "#D97706" }}>
                      {job.title}
                    </Link>
                    <div className="text-xs font-mono mt-0.5" style={{ color: "#94A3B8" }}>{job.jobNumber}</div>
                  </td>
                  <td className="px-6 py-4" style={{ color: "#64748B" }}>{job.client.name}</td>
                  <td className="px-6 py-4" style={{ color: "#64748B" }}>{job.scheduledTime}</td>
                  <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: {
  label: string; value: number; icon: string;
  accent: "amber" | "sky" | "green" | "red";
}) {
  const styles = {
    amber: { bg: "#FEF3C7", text: "#D97706", icon: "#92400E" },
    sky:   { bg: "#E0F2FE", text: "#0EA5E9", icon: "#0C4A6E" },
    green: { bg: "#DCFCE7", text: "#22C55E", icon: "#14532D" },
    red:   { bg: "#FEE2E2", text: "#EF4444", icon: "#7F1D1D" },
  };
  const s = styles[accent];
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
          <StatIcon name={icon} color={s.text} />
        </div>
        <span className="font-display font-bold text-2xl" style={{ color: s.icon }}>{value}</span>
      </div>
      <p className="text-sm font-medium" style={{ color: "#64748B" }}>{label}</p>
    </div>
  );
}

function StatIcon({ name, color }: { name: string; color: string }) {
  if (name === "clipboard") return (
    <svg className="w-5 h-5" style={{ color }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
  if (name === "refresh") return (
    <svg className="w-5 h-5" style={{ color }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
  if (name === "users") return (
    <svg className="w-5 h-5" style={{ color }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
  if (name === "document") return (
    <svg className="w-5 h-5" style={{ color }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
  return null;
}
