import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyWorkerNewJob } from "@/lib/wa";
import { notifyAdminJobAssigned } from "@/lib/notifications";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      areas: {
        orderBy: { sortOrder: "asc" },
        include: { items: true },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

const UpdateWorkersSchema = z.object({
  workerIds: z.array(z.string()),
});

export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { workerIds } = UpdateWorkersSchema.parse(body);

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check for double-booking
    const activeJobs = await prisma.job.findMany({
      where: {
        id: { not: id },
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        workers: {
          some: { workerId: { in: workerIds } },
        },
      },
      include: {
        workers: {
          where: { workerId: { in: workerIds } },
          include: { worker: { select: { name: true } } },
        },
      },
    });

    if (activeJobs.length > 0) {
      const busyWorker = activeJobs[0].workers[0]?.worker.name;
      return NextResponse.json(
        { error: `Worker ${busyWorker} sudah ditugaskan ke job aktif lain` },
        { status: 400 }
      );
    }

    // Delete existing work sessions
    const existingWorkerIds = await prisma.workSession.findMany({
      where: { jobId: id },
      select: { workerId: true },
    });
    const existingWorkerIdSet = new Set(existingWorkerIds.map(w => w.workerId));

    await prisma.workSession.deleteMany({ where: { jobId: id } });

    // Create new work sessions
    let newWorkers: { id: string; phone: string; name: string }[] = [];
    if (workerIds.length > 0) {
      await prisma.workSession.createMany({
        data: workerIds.map((workerId) => ({
          jobId: id,
          workerId,
        })),
      });

      // Find newly added workers (not in existing set)
      const newWorkerIds = workerIds.filter(id => !existingWorkerIdSet.has(id));
      if (newWorkerIds.length > 0) {
        newWorkers = await prisma.worker.findMany({
          where: { id: { in: newWorkerIds }, role: "FIELD" },
          select: { id: true, phone: true, name: true },
        });
      }
    }

    // Update job status: DRAFT -> ASSIGNED if workers added
    const currentStatus = job.status;
    if (currentStatus === "DRAFT" && workerIds.length > 0) {
      await prisma.job.update({
        where: { id },
        data: { status: "ASSIGNED" },
      });
    } else if (workerIds.length === 0 && currentStatus === "ASSIGNED") {
      // If all workers removed from ASSIGNED job, go back to DRAFT
      await prisma.job.update({
        where: { id },
        data: { status: "DRAFT" },
      });
    }

    // Send WhatsApp notifications to newly added workers
    if (newWorkers.length > 0) {
      const updatedJob = await prisma.job.findUnique({ where: { id } });
      const client = await prisma.client.findUnique({ where: { id: updatedJob?.clientId } });
      const workerNames = newWorkers.map(w => w.name);

      await Promise.all([
        // Notify workers via WhatsApp
        ...newWorkers.map(w =>
          notifyWorkerNewJob(
            w.phone,
            w.name,
            updatedJob?.title ?? "",
            client?.name ?? "",
            updatedJob?.scheduledDate?.toISOString().slice(0, 10) ?? "",
            updatedJob?.scheduledTime ?? ""
          ).catch(err => {
            console.warn(`WhatsApp failed for ${w.phone}:`, err);
            return null;
          })
        ),
        // Notify admin/supervisor
        notifyAdminJobAssigned(
          id,
          updatedJob?.slug ?? "",
          updatedJob?.jobNumber ?? "",
          updatedJob?.title ?? "",
          client?.name ?? "",
          workerNames,
          updatedJob?.scheduledDate?.toISOString().slice(0, 10) ?? "",
          updatedJob?.scheduledTime ?? ""
        ).catch(err => {
          console.warn(`Job assigned notification failed:`, err);
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Update workers error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
