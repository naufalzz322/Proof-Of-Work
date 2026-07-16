import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { WorkerRole } from "@prisma/client";

// Zod validation schema for worker update
const UpdateWorkerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "FIELD"]).optional(),
  password: z.string().min(6, "Password minimal 6 karakter").optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const worker = await prisma.worker.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  if (!worker) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  return NextResponse.json(worker);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Validate with Zod
    const validated = UpdateWorkerSchema.parse(body);

    const existing = await prisma.worker.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (validated.name !== undefined) data.name = validated.name;
    if (validated.phone !== undefined) data.phone = validated.phone;
    if (validated.role !== undefined) data.role = validated.role;
    if (validated.password !== undefined && validated.password !== null) {
      data.passwordHash = await bcrypt.hash(validated.password, 10);
    }

    const updated = await prisma.worker.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Update worker error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/admin/workers/[id] - Delete worker
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  // Check if worker has assigned jobs via WorkSession
  const assignedJobs = await prisma.workSession.count({
    where: { workerId: id },
  });

  if (assignedJobs > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus worker. Worker ini masih ditugaskan di ${assignedJobs} job.` },
      { status: 400 }
    );
  }

  await prisma.worker.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Worker berhasil dihapus" });
}
