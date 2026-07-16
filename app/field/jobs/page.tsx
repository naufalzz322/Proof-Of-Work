export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function FieldJobsPage() {
  const session = await auth();

  // Only get today's jobs assigned to this worker
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's jobs for this worker - only ASSIGNED and IN_PROGRESS
  const jobs = await prisma.job.findMany({
    where: {
      scheduledDate: { gte: today, lt: tomorrow },
      workers: { some: { workerId: session!.user.id } },
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    },
    include: {
      client: true,
      workers: {
        include: { worker: true },
      },
      areas: {
        include: {
          items: true,
          photos: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { scheduledTime: "asc" }],
  });

  const getJobProgress = (job: (typeof jobs)[0]) => {
    const allItems = job.areas.flatMap((a) => a.items);
    const doneItems = allItems.filter((i) => i.isDone).length;
    return { done: doneItems, total: allItems.length };
  };

  const getMySession = (job: (typeof jobs)[0]) =>
    job.workers.find((w) => w.workerId === session!.user.id);

  // No jobs today
  if (jobs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Tidak Ada Job Hari Ini</h1>
        <p className="text-slate-500 text-sm max-w-xs">
          Tidak ada pekerjaan yang dijadwalkan untuk Anda hari ini. Istirahat dan nikmati waktu Anda!
        </p>
        <div className="mt-8 text-xs text-slate-400">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>
    );
  }

  // Only one job today - Hero mode
  if (jobs.length === 1) {
    const job = jobs[0];
    const mySession = getMySession(job);
    const progress = getJobProgress(job);
    const isCheckedIn = !!mySession?.checkInAt;
    const isCompleted = job.status === "COMPLETED";
    const progressPercent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

    return (
      <div className="min-h-screen flex flex-col">
        {/* Date header */}
        <div className="px-4 py-3 text-center border-b border-slate-100">
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Hero card - single job focus */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          {/* Status badge */}
          <div className="text-center mb-6">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                SELESAI
              </span>
            ) : isCheckedIn ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                CHECK-IN {new Date(mySession!.checkInAt!).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                BELUM CHECK-IN · {job.scheduledTime}
              </span>
            )}
          </div>

          {/* Job title & client */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{job.title}</h1>
            <p className="text-slate-500">{job.client.name}</p>
          </div>

          {/* Progress bar */}
          {!isCompleted && (
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Progress</span>
                <span className="font-semibold text-slate-700">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    progressPercent === 100 ? "bg-green-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-center">
                {progress.done}/{progress.total} checklist selesai
              </p>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center justify-center gap-2 text-slate-500 mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-sm">{job.locationAddress}</span>
          </div>

          {/* Action button */}
          <div className="space-y-3">
            {isCompleted ? (
              <Link
                href={`/field/jobs/${job.slug}/done`}
                className="block w-full py-4 text-center text-white font-bold text-lg rounded-2xl"
                style={{ background: "#16A34A" }}
              >
                Lihat Laporan
              </Link>
            ) : isCheckedIn ? (
              <Link
                href={`/field/jobs/${job.slug}/areas`}
                className="block w-full py-4 text-center text-white font-bold text-lg rounded-2xl"
                style={{ background: "#D97706" }}
              >
                Lanjut ke Checklist
              </Link>
            ) : (
              <Link
                href={`/field/jobs/${job.slug}/checkin`}
                className="block w-full py-4 text-center text-white font-bold text-lg rounded-2xl"
                style={{ background: "#0F172A" }}
              >
                Mulai Kerja
              </Link>
            )}

            {/* Secondary info */}
            <div className="flex justify-center gap-6 text-xs text-slate-400 pt-2">
              <span>{job.areas.length} area</span>
              <span>·</span>
              <span>{progress.total} tugas</span>
              <span>·</span>
              <span>{job.scheduledTime}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multiple jobs today - Card list mode
  return (
    <div className="min-h-screen">
      {/* Date header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Jobs list */}
      <div className="p-4 space-y-3">
        {jobs.map((job) => {
          const mySession = getMySession(job);
          const progress = getJobProgress(job);
          const isCheckedIn = !!mySession?.checkInAt;
          const isCompleted = job.status === "COMPLETED";
          const progressPercent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

          return (
            <Link
              key={job.id}
              href={isCompleted ? `/field/jobs/${job.slug}/done` : isCheckedIn ? `/field/jobs/${job.slug}/areas` : `/field/jobs/${job.slug}/checkin`}
              className="block bg-white rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-0.5">{job.title}</h3>
                  <p className="text-sm text-slate-500">{job.client.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isCompleted ? "bg-green-100 text-green-700" :
                  isCheckedIn ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {isCompleted ? "✓ Selesai" : isCheckedIn ? "✓ Check-in" : "⏳"}
                </span>
              </div>

              {/* Progress */}
              {!isCompleted && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-amber-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{job.scheduledTime}</span>
                <span>·</span>
                <span>{progress.done}/{progress.total} tugas</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
