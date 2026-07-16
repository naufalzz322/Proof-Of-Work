import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod validation schema for recurring schedule creation
const CreateRecurringSchema = z.object({
  clientId: z.string().min(1, "Klien wajib dipilih"),
  title: z.string().min(1, "Judul wajib diisi").max(200),
  locationAddress: z.string().max(500).optional().default(""),
  locationLat: z.number().optional().nullable(),
  locationLng: z.number().optional().nullable(),
  locationRadius: z.number().optional().default(200),
  scheduledTime: z.string().min(1).regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  recurrence: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().default([]),
  dayOfMonth: z.number().min(1).max(31).optional().nullable(),
  endDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional(),
});

// GET /api/admin/recurring - List all recurring schedules
export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedules = await prisma.recurringSchedule.findMany({
    where: {},
    include: {
      client: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(schedules);
}

// POST /api/admin/recurring - Create new recurring schedule
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = CreateRecurringSchema.parse(body);

    const schedule = await prisma.recurringSchedule.create({
      data: {
        clientId: validated.clientId,
        title: validated.title,
        locationAddress: validated.locationAddress,
        locationLat: validated.locationLat ?? 0,
        locationLng: validated.locationLng ?? 0,
        locationRadius: validated.locationRadius,
        scheduledTime: validated.scheduledTime,
        recurrence: validated.recurrence,
        daysOfWeek: validated.daysOfWeek,
        dayOfMonth: validated.dayOfMonth,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        notes: validated.notes,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Create recurring schedule error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
