import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod validation schema for client update
const UpdateClientSchema = z.object({
  name: z.string().min(1, "Nama klien wajib diisi").max(200).optional(),
  contactName: z.string().max(100).optional(),
  contactTitle: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/clients/[id] - Get single client
export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { scheduledDate: "desc" },
        take: 20,
        select: {
          id: true,
          jobNumber: true,
          title: true,
          status: true,
          scheduledDate: true,
          workers: {
            select: { worker: { select: { id: true, name: true } } },
          },
          signature: { select: { id: true } },
          report: { select: { id: true } },
        },
      },
      recurringSchedules: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          recurrence: true,
          daysOfWeek: true,
          dayOfMonth: true,
          scheduledTime: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          jobs: true,
          recurringSchedules: true,
        },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

// PUT /api/admin/clients/[id] - Update client
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = UpdateClientSchema.parse(body);

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (validated.name !== undefined) data.name = validated.name;
    if (validated.contactName !== undefined) data.contactName = validated.contactName;
    if (validated.contactTitle !== undefined) data.contactTitle = validated.contactTitle;
    if (validated.contactPhone !== undefined) data.contactPhone = validated.contactPhone;
    if (validated.contactEmail !== undefined) data.contactEmail = validated.contactEmail || null;
    if (validated.address !== undefined) data.address = validated.address;

    const updated = await prisma.client.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/admin/clients/[id] - Delete client
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Check if client has jobs
  const jobCount = await prisma.job.count({
    where: { clientId: id },
  });

  if (jobCount > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus klien. Klien ini memiliki ${jobCount} job.` },
      { status: 400 }
    );
  }

  // Check if client has recurring schedules
  const scheduleCount = await prisma.recurringSchedule.count({
    where: { clientId: id },
  });

  if (scheduleCount > 0) {
    return NextResponse.json(
      { error: `Tidak dapat menghapus klien. Klien ini memiliki ${scheduleCount} jadwal otomatis.` },
      { status: 400 }
    );
  }

  await prisma.client.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Klien berhasil dihapus" });
}
