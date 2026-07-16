import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod validation schema for recurring schedule update
const UpdateRecurringSchema = z.object({
  clientId: z.string().min(1, "Klien wajib dipilih").optional(),
  title: z.string().min(1, "Judul wajib diisi").max(200).optional(),
  locationAddress: z.string().max(500).optional(),
  locationLat: z.number().optional().nullable(),
  locationLng: z.number().optional().nullable(),
  locationRadius: z.number().optional(),
  scheduledTime: z.string().min(1).regex(/^\d{2}:\d{2}$/, "Format HH:MM").optional(),
  recurrence: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional().nullable(),
  isActive: z.boolean().optional(),
  endDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/recurring/[id] - Get single recurring schedule
export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const schedule = await prisma.recurringSchedule.findUnique({
    where: { id },
    include: {
      client: {
        select: { id: true, name: true, contactName: true, contactPhone: true, contactEmail: true },
      },
    },
  });

  if (!schedule) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  return NextResponse.json(schedule);
}

// PUT /api/admin/recurring/[id] - Update recurring schedule
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validated = UpdateRecurringSchema.parse(body);

    const existing = await prisma.recurringSchedule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (validated.clientId !== undefined) data.clientId = validated.clientId;
    if (validated.title !== undefined) data.title = validated.title;
    if (validated.locationAddress !== undefined) data.locationAddress = validated.locationAddress;
    if (validated.locationLat !== undefined) data.locationLat = validated.locationLat;
    if (validated.locationLng !== undefined) data.locationLng = validated.locationLng;
    if (validated.locationRadius !== undefined) data.locationRadius = validated.locationRadius;
    if (validated.scheduledTime !== undefined) data.scheduledTime = validated.scheduledTime;
    if (validated.recurrence !== undefined) data.recurrence = validated.recurrence;
    if (validated.daysOfWeek !== undefined) data.daysOfWeek = validated.daysOfWeek;
    if (validated.dayOfMonth !== undefined) data.dayOfMonth = validated.dayOfMonth;
    if (validated.isActive !== undefined) data.isActive = validated.isActive;
    if (validated.endDate !== undefined) {
      data.endDate = validated.endDate ? new Date(validated.endDate) : null;
    }
    if (validated.notes !== undefined) data.notes = validated.notes;

    const updated = await prisma.recurringSchedule.update({
      where: { id },
      data,
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Update recurring schedule error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/admin/recurring/[id] - Delete recurring schedule
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.recurringSchedule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  await prisma.recurringSchedule.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Jadwal berhasil dihapus" });
}
