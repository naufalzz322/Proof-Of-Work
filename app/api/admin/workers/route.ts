import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { WorkerRole } from "@prisma/client";

// Zod validation schema for worker creation
const CreateWorkerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().max(20, "Telepon maksimal 20 karakter").optional().default(""),
  role: z.enum(["ADMIN", "SUPERVISOR", "FIELD"], { message: "Role tidak valid" }),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

// Zod validation schema for worker update
const UpdateWorkerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "FIELD"]).optional(),
  password: z.string().min(6).optional().nullable(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") as WorkerRole | null;
  const withStatus = searchParams.get("withStatus") === "true";
  const withStats = searchParams.get("withStats") === "true";

  const workers = await prisma.worker.findMany({
    where: role ? { role } : {},
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  // If withStats is requested, get job completion stats
  if (withStats) {
    const completedJobs = await prisma.job.findMany({
      where: { status: "COMPLETED" },
      include: {
        workers: {
          select: { workerId: true },
        },
      },
    });

    const lastActiveJobs = await prisma.job.findMany({
      where: {
        status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] },
      },
      include: {
        workers: {
          select: { workerId: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Build worker stats
    const workerStats = new Map<string, { completedJobs: number; lastJob: string | null }>();
    for (const job of completedJobs) {
      for (const ws of job.workers) {
        const current = workerStats.get(ws.workerId) || { completedJobs: 0, lastJob: null };
        workerStats.set(ws.workerId, {
          completedJobs: current.completedJobs + 1,
          lastJob: current.lastJob,
        });
      }
    }
    for (const job of lastActiveJobs) {
      for (const ws of job.workers) {
        const current = workerStats.get(ws.workerId);
        if (current) {
          current.lastJob = job.title;
        }
      }
    }

    // Add stats to each worker
    const workersWithStats = workers.map((w) => {
      const stats = workerStats.get(w.id) || { completedJobs: 0, lastJob: null };
      return {
        ...w,
        completedJobs: stats.completedJobs,
        lastJob: stats.lastJob,
        memberSince: w.createdAt,
      };
    });

    if (withStatus) {
      // Get active job assignments
      const activeJobs = await prisma.job.findMany({
        where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        include: {
          workers: { select: { workerId: true } },
        },
      });

      const workerJobMap = new Map<string, { id: string; title: string }>();
      for (const job of activeJobs) {
        for (const ws of job.workers) {
          workerJobMap.set(ws.workerId, { id: job.id, title: job.title });
        }
      }

      return NextResponse.json(
        workersWithStats.map((w) => {
          const job = workerJobMap.get(w.id);
          return {
            ...w,
            status: job ? "BUSY" : "AVAILABLE",
            currentJob: job ?? null,
          };
        })
      );
    }

    return NextResponse.json(workersWithStats);
  }

  // If withStatus is requested without stats
  if (withStatus) {
    const activeJobs = await prisma.job.findMany({
      where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      include: {
        workers: { select: { workerId: true } },
      },
    });

    const workerJobMap = new Map<string, { id: string; title: string }>();
    for (const job of activeJobs) {
      for (const ws of job.workers) {
        workerJobMap.set(ws.workerId, { id: job.id, title: job.title });
      }
    }

    return NextResponse.json(
      workers.map((w) => {
        const job = workerJobMap.get(w.id);
        return {
          ...w,
          status: job ? "BUSY" : "AVAILABLE",
          currentJob: job ?? null,
        };
      })
    );
  }

  return NextResponse.json(workers);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate with Zod
    const validated = CreateWorkerSchema.parse(body);

    const existing = await prisma.worker.findUnique({ where: { email: validated.email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(validated.password || "pytago123", 10);
    const worker = await prisma.worker.create({
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        role: validated.role,
        passwordHash,
      },
    });

    return NextResponse.json({ id: worker.id, name: worker.name, email: worker.email, role: worker.role }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Create worker error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
