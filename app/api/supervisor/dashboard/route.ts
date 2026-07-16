import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const now = new Date();

    // Get all work sessions for today (only from active jobs)
    const todaySessions = await prisma.workSession.findMany({
      where: {
        job: {
          scheduledDate: { gte: today, lt: tomorrow },
          status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
        },
      },
      include: {
        worker: { select: { id: true, name: true, phone: true, role: true } },
        job: {
          select: {
            id: true, slug: true, title: true, jobNumber: true, status: true,
            scheduledTime: true, locationAddress: true,
            client: { select: { name: true } },
            areas: { include: { items: true } },
            signature: true,
            workers: {
              include: { worker: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { checkInAt: "asc" },
    });

    // Get all jobs for today (only ASSIGNED, IN_PROGRESS, COMPLETED - monitoring scope)
    const todayJobs = await prisma.job.findMany({
      where: {
        scheduledDate: { gte: today, lt: tomorrow },
        status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
      },
      include: {
        client: { select: { name: true } },
        workers: { include: { worker: { select: { id: true, name: true } } } },
        areas: { include: { items: true } },
        signature: true,
      },
      orderBy: { scheduledTime: "asc" },
    });

    // Get recent activity (last 2 hours, or older if less than 5)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const recentSessions = await prisma.workSession.findMany({
      where: {
        checkInAt: { gte: twoHoursAgo },
        job: {
          status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
        },
      },
      include: {
        worker: { select: { name: true } },
        job: {
          select: {
            id: true, slug: true, title: true,
            client: { select: { name: true } },
          },
        },
      },
      orderBy: { checkInAt: "desc" },
      take: 20,
    });

    // If less than 5 recent sessions, get older ones from today
    let activityFeedSessions = recentSessions;
    if (recentSessions.length < 5) {
      const todayStart = new Date(today);
      const olderSessions = await prisma.workSession.findMany({
        where: {
          checkInAt: { gte: todayStart, lt: twoHoursAgo },
          job: {
            status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
          },
        },
        include: {
          worker: { select: { name: true } },
          job: {
            select: {
              id: true, slug: true, title: true,
              client: { select: { name: true } },
            },
          },
        },
        orderBy: { checkInAt: "desc" },
        take: 5 - recentSessions.length,
      });
      activityFeedSessions = [...recentSessions, ...olderSessions];
    }

    // Get all field workers
    const allWorkers = await prisma.worker.findMany({
      where: { role: "FIELD" },
      select: { id: true, name: true, phone: true },
    });

    // Calculate job progress
    const jobsWithProgress = todayJobs.map((job) => {
      const allItems = job.areas.flatMap((a) => a.items);
      const doneItems = allItems.filter((i) => i.isDone).length;
      const checkedInCount = job.workers.filter((w) => w.checkInAt != null).length;
      return {
        id: job.id,
        slug: job.slug,
        title: job.title,
        jobNumber: job.jobNumber,
        status: job.status,
        scheduledDate: job.scheduledDate.toISOString().split('T')[0],
        scheduledTime: job.scheduledTime,
        locationAddress: job.locationAddress,
        client: job.client,
        progress: { done: doneItems, total: allItems.length },
        checkedInCount,
        totalWorkers: job.workers.length,
        hasSignature: !!job.signature,
        areas: job.areas.map((area) => ({
          id: area.id,
          name: area.name,
          items: area.items.map((item) => ({ isDone: item.isDone })),
        })),
        workers: job.workers.map((w) => ({ worker: { id: w.worker.id } })),
      };
    });

    // Worker status mapping
    const checkedInWorkerIds = new Set(
      todaySessions
        .filter((s) => s.checkInAt != null)
        .map((s) => s.workerId)
    );

    const workerStatuses = allWorkers.map((worker) => {
      const activeSession = todaySessions.find(
        (s) => s.workerId === worker.id && s.checkInAt != null
      );
      const todayWorkerSessions = todaySessions.filter((s) => s.workerId === worker.id);
      const latestSession = todayWorkerSessions[todayWorkerSessions.length - 1];

      let status: "available" | "working" | "on_break" | "not_scheduled" = "not_scheduled";
      let currentJob = null;
      let progress = 0;

      if (activeSession) {
        status = "working";
        currentJob = {
          id: activeSession.job.id,
          slug: activeSession.job.slug,
          title: activeSession.job.title,
        };
        const allItems = activeSession.job.areas.flatMap((a) => a.items);
        const doneItems = allItems.filter((i) => i.isDone).length;
        progress = allItems.length > 0 ? Math.round((doneItems / allItems.length) * 100) : 0;
      }

      // Check if late (assigned to job but hasn't check-in)
      const hasAssignment = todayJobs.some((j) =>
        j.workers.some((w) => w.worker.id === worker.id)
      );
      const isLate = hasAssignment && !activeSession && latestSession == null;

      return {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        status,
        currentJob,
        progress,
        checkInAt: activeSession?.checkInAt || null,
        isLate,
      };
    });

    // Activity feed
    const activityFeed = activityFeedSessions.map((session) => ({
      id: session.id,
      type: "checkin" as const,
      workerName: session.worker.name,
      jobTitle: session.job.title,
      clientName: session.job.client.name,
      time: session.checkInAt,
      jobSlug: session.job.slug,
    }));

    // Group jobs by time period
    const jobGroups = {
      pagi: jobsWithProgress.filter((j) => {
        const mins = timeToMinutes(j.scheduledTime);
        return mins >= 360 && mins < 720; // 06:00 - 11:59
      }),
      siang: jobsWithProgress.filter((j) => {
        const mins = timeToMinutes(j.scheduledTime);
        return mins >= 720 && mins < 1020; // 12:00 - 16:59
      }),
      sore: jobsWithProgress.filter((j) => {
        const mins = timeToMinutes(j.scheduledTime);
        return mins >= 1020 && mins < 1260; // 17:00 - 20:59
      }),
      malam: jobsWithProgress.filter((j) => {
        const mins = timeToMinutes(j.scheduledTime);
        return mins >= 1260 || mins < 360; // 21:00 - 05:59
      }),
    };

    // Stats
    const workersWithAssignments = new Set(
      todayJobs.flatMap((j) => j.workers.map((w) => w.worker.id))
    );
    const workersNotCheckedIn = [...workersWithAssignments].filter((workerId) => {
      return !workerStatuses.some((w) => w.id === workerId && w.status === "working");
    }).length;

    const stats = {
      totalJobs: todayJobs.length,
      checkedIn: workerStatuses.filter((w) => w.status === "working").length,
      notCheckedIn: workersNotCheckedIn,
      lowProgress: jobsWithProgress.filter((j) => {
        if (j.status !== "IN_PROGRESS") return false;
        if (j.progress.total === 0) return false;
        const pct = (j.progress.done / j.progress.total) * 100;
        return pct < 50;
      }).length,
      lateWorkers: workerStatuses.filter((w) => w.isLate).length,
    };

    return NextResponse.json({
      stats,
      jobs: jobsWithProgress,
      jobGroups,
      workers: workerStatuses,
      activityFeed,
      alerts: {
        lowProgressCount: stats.lowProgress,
        lateWorkerCount: workerStatuses.filter((w) => w.isLate).length,
        noCheckInCount: workersNotCheckedIn,
      },
    });
  } catch (error) {
    console.error("[Supervisor Dashboard API Error]", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
