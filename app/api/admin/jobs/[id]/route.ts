import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/serialize";

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
    select: {
      id: true, slug: true, jobNumber: true, title: true, description: true,
      locationAddress: true, locationLat: true, locationLng: true,
      scheduledDate: true, scheduledTime: true, notes: true, status: true,
      client: { select: { id: true, name: true } },
      areas: {
        orderBy: { sortOrder: "asc" },
        include: { items: true, photos: true },
      },
      workers: {
        include: { worker: { select: { id: true, name: true, phone: true } } },
      },
      signature: true,
      report: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(serializePrisma(job));
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
    title,
    description,
    clientId,
    locationAddress,
    locationLat,
    locationLng,
    scheduledDate,
    scheduledTime,
    notes,
    status,
  } = body;

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Build update data - supervisor can only edit schedule + notes
  const isAdmin = session.user.role === "ADMIN";
  const updateData: Record<string, unknown> = {};

  if (isAdmin) {
    // Admin can edit everything
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (clientId) updateData.client = { connect: { id: clientId } };
    if (locationAddress !== undefined) updateData.locationAddress = locationAddress;
    // Only update coordinates if they have valid values (not null)
    if (locationLat !== undefined && locationLat !== null) {
      updateData.locationLat = locationLat;
    }
    if (locationLng !== undefined && locationLng !== null) {
      updateData.locationLng = locationLng;
    }
    if (status) updateData.status = status;
  }

  // Both admin and supervisor can edit schedule and notes
  if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
  if (scheduledTime) updateData.scheduledTime = scheduledTime;
  if (notes !== undefined) updateData.notes = notes;

  const updated = await prisma.job.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Delete WorkSessions first (worker assignments)
  await prisma.workSession.deleteMany({ where: { jobId: id } });

  // Then delete the job (cascade will delete areas, items, photos, etc.)
  await prisma.job.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
