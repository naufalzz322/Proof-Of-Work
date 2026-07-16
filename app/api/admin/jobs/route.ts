import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyWorkerNewJob } from "@/lib/wa";
import { notifyAdminJobAssigned } from "@/lib/notifications";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { serializePrisma } from "@/lib/serialize";

// GET - List all jobs with optional filters, or get active jobs for worker availability
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const status = searchParams.get("status");
    const activeJobsOnly = searchParams.get("activeJobs");
    const clientId = searchParams.get("clientId");
    const clientSlug = searchParams.get("client");
    const fromDate = searchParams.get("fromDate");
    const includeProgress = searchParams.get("includeProgress");
    const sort = searchParams.get("sort");

    // Return active jobs with worker IDs for worker availability check
    if (activeJobsOnly === "true") {
      const activeJobs = await prisma.job.findMany({
        where: {
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
        },
        include: {
          workers: {
            select: {
              workerId: true,
            },
          },
        },
      });
      // Flatten to get just workerIds
      const result = activeJobs.map(job => ({
        id: job.id,
        title: job.title,
        workerIds: job.workers.map(w => w.workerId),
      }));
      return NextResponse.json(serializePrisma(result));
    }

    const where: Prisma.JobWhereInput = {};

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { jobNumber: { contains: query, mode: "insensitive" } },
        { client: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status as Prisma.EnumJobStatusFilter["equals"];
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (clientSlug) {
      where.client = { slug: clientSlug };
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      where.scheduledDate = { gte: from };
    }

    const include: Prisma.JobInclude = {
      client: { select: { id: true, slug: true, name: true } },
      signature: { select: { id: true } },
      report: { select: { id: true } },
    };

    // Include workers and areas if progress is requested
    if (includeProgress === "true") {
      include.workers = { include: { worker: true } };
      include.areas = { include: { items: true } };
    }

    const jobs = await prisma.job.findMany({
      where,
      include,
      orderBy: { scheduledDate: sort === "oldest" ? "asc" : "desc" },
    });

    return NextResponse.json(serializePrisma(jobs));
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// Zod validation schema for job creation
const CreateJobSchema = z.object({
  title: z.string().min(1, "Judul job wajib diisi").max(200, "Judul maksimal 200 karakter"),
  description: z.string().max(1000).optional().default(""),
  clientId: z.string().min(1, "Klien wajib dipilih"),
  locationAddress: z.string().max(500).optional().default(""),
  locationLat: z.number().optional().nullable(),
  locationLng: z.number().optional().nullable(),
  scheduledDate: z.string().min(1, "Tanggal wajib diisi"),
  scheduledTime: z.string().min(1, "Waktu wajib diisi").regex(/^\d{2}:\d{2}$/, "Format waktu HH:MM"),
  notes: z.string().max(500).optional().default(""),
  areas: z.array(z.object({
    name: z.string().min(1, "Nama area wajib diisi").max(100),
    items: z.array(z.object({
      label: z.string().min(1).max(200),
    })),
  })).optional().default([]),
  workerIds: z.array(z.string()).optional().default([]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate with Zod
    const validated = CreateJobSchema.parse(body);

    // Validate workers exist and are FIELD role
    let workers: { id: string; phone: string; name: string }[] = [];
    if (validated.workerIds && validated.workerIds.length > 0) {
      // Check if any worker is already assigned to an active job via WorkSession
      const activeJobs = await prisma.job.findMany({
        where: {
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          workers: {
            some: {
              workerId: { in: validated.workerIds },
            },
          },
        },
        include: {
          workers: {
            where: {
              workerId: { in: validated.workerIds },
            },
            select: {
              workerId: true,
            },
          },
        },
      });

      // Find workers that are already booked
      const bookedWorkerIds = new Set<string>();
      for (const job of activeJobs) {
        for (const session of job.workers) {
          bookedWorkerIds.add(session.workerId);
        }
      }

      if (bookedWorkerIds.size > 0) {
        const allWorkers = await prisma.worker.findMany({
          where: { id: { in: Array.from(bookedWorkerIds) } },
          select: { id: true, name: true },
        });
        const names = allWorkers.map(w => w.name).join(", ");
        return NextResponse.json(
          { error: `Worker sudah ditugaskan ke job aktif: ${names}. Selesaikan atau bebaskan worker terlebih dahulu.` },
          { status: 400 }
        );
      }

      workers = await prisma.worker.findMany({
        where: { id: { in: validated.workerIds }, role: "FIELD" },
        select: { id: true, phone: true, name: true },
      });
    }

    // Generate job number with date format: LAP-YYYYMMDD-XXX (also used as slug)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const countToday = await prisma.job.count({
      where: {
        jobNumber: {
          startsWith: `LAP-${dateStr}`,
        },
      },
    });
    const jobNumber = `LAP-${dateStr}-${String(countToday + 1).padStart(3, "0")}`;
    // Use jobNumber as slug for consistency
    const slug = jobNumber;

    const job = await prisma.job.create({
      data: {
        slug,
        jobNumber,
        title: validated.title,
        description: validated.description,
        clientId: validated.clientId,
        locationAddress: validated.locationAddress,
        locationLat: validated.locationLat ?? 0,
        locationLng: validated.locationLng ?? 0,
        scheduledDate: new Date(validated.scheduledDate),
        scheduledTime: validated.scheduledTime,
        notes: validated.notes,
        status: workers.length > 0 ? "ASSIGNED" : "DRAFT",
        areas: {
          create: validated.areas.map((area, idx) => ({
            name: area.name,
            sortOrder: idx,
            items: {
              create: area.items.map((item) => ({
                label: item.label,
              })),
            },
          })),
        },
      },
    });

    // Now create WorkSessions and send WhatsApp
    if (workers.length > 0) {
      const client = await prisma.client.findUnique({ where: { id: validated.clientId } });
      const workerNames = workers.map(w => w.name);

      await Promise.all([
        prisma.workSession.createMany({
          data: workers.map((w) => ({ jobId: job.id, workerId: w.id })),
          skipDuplicates: true,
        }),
        // Notify workers via WhatsApp
        ...workers.map((w) =>
          notifyWorkerNewJob(
            w.phone,
            w.name,
            validated.title,
            client?.name ?? "",
            validated.scheduledDate,
            validated.scheduledTime
          ).catch((err) => {
            console.warn(`WhatsApp failed for ${w.phone}:`, err);
            return null;
          })
        ),
        // Notify admin/supervisor that job was assigned
        notifyAdminJobAssigned(
          job.id,
          job.slug,
          job.jobNumber,
          validated.title,
          client?.name ?? "",
          workerNames,
          validated.scheduledDate,
          validated.scheduledTime
        ).catch((err) => {
          console.warn(`Job assigned notification failed:`, err);
        }),
      ]);
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
