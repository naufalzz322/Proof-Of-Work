import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron Endpoint: /api/cron/create-jobs
 * Called daily by cron-job.org or any external scheduler
 *
 * Environment:
 * - CRON_SECRET: Bearer token for authentication (optional but recommended)
 */
export async function POST(req: Request) {
  // Verify authorization (if CRON_SECRET is set)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, etc.
    const dayOfMonth = today.getDate(); // 1-31
    const todayStr = today.toISOString().slice(0, 10);

    // Get all active recurring schedules
    const schedules = await prisma.recurringSchedule.findMany({
      where: { isActive: true },
      include: { client: true },
    });

    const results = [];
    const errors = [];

    for (const schedule of schedules) {
      try {
        // Check if should create job today
        let shouldCreate = false;

        if (schedule.recurrence === "DAILY") {
          shouldCreate = true;
        } else if (schedule.recurrence === "WEEKLY") {
          shouldCreate = schedule.daysOfWeek.includes(dayOfWeek);
        } else if (schedule.recurrence === "MONTHLY") {
          shouldCreate = schedule.dayOfMonth === dayOfMonth;
        }

        if (!shouldCreate) continue;

        // Check if job already exists for this schedule today (avoid duplicates)
        const existingJob = await prisma.job.findFirst({
          where: {
            clientId: schedule.clientId,
            title: schedule.title,
            scheduledDate: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        if (existingJob) {
          results.push({
            scheduleId: schedule.id,
            title: schedule.title,
            status: "skipped",
            reason: "Job already exists for today",
            existingJobNumber: existingJob.jobNumber,
          });
          continue;
        }

        // Generate job number
        const dateStr = todayStr.replace(/-/g, "");
        const countToday = await prisma.job.count({
          where: {
            jobNumber: { startsWith: `LAP-${dateStr}` },
          },
        });
        const jobNumber = `LAP-${dateStr}-${String(countToday + 1).padStart(3, "0")}`;

        // Create the job
        const job = await prisma.job.create({
          data: {
            jobNumber,
            slug: jobNumber,
            clientId: schedule.clientId,
            title: schedule.title,
            locationAddress: schedule.locationAddress || "",
            locationLat: 0,
            locationLng: 0,
            scheduledDate: today,
            scheduledTime: schedule.scheduledTime,
            status: "DRAFT",
          },
        });

        results.push({
          scheduleId: schedule.id,
          title: schedule.title,
          status: "created",
          jobId: job.id,
          jobNumber: job.jobNumber,
        });

      } catch (error) {
        errors.push({
          scheduleId: schedule.id,
          title: schedule.title,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const skipped = results.filter(r => r.status === "skipped").length;

    return NextResponse.json({
      success: true,
      date: todayStr,
      summary: {
        total: schedules.length,
        created,
        skipped,
        errors: errors.length,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

/**
 * Also support GET for easy testing
 */
export async function GET(req: Request) {
  return POST(req);
}
