import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdminWorkerCheckIn } from "@/lib/notifications";
import { isWithinGeofence } from "@/lib/geofence";

// Calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate late minutes from scheduled time
function calculateLateMinutes(scheduledTime: string, checkInTime: Date): number {
  const [hours, minutes] = scheduledTime.split(":").map(Number);
  const scheduledDate = new Date(checkInTime);
  scheduledDate.setHours(hours, minutes, 0, 0);

  const diff = checkInTime.getTime() - scheduledDate.getTime();
  const diffMinutes = Math.round(diff / 60000);

  return diffMinutes > 0 ? diffMinutes : 0;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { lat, lng, isOverride, overrideReason } = await req.json();

  if (lat == null || lng == null) {
    return NextResponse.json({ error: "Latitude dan longitude wajib diisi" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      jobNumber: true,
      status: true,
      scheduledTime: true,
      locationLat: true,
      locationLng: true,
      locationRadius: true,
      client: { select: { name: true } },
    },
  });
  if (!job) {
    return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
  }

  // Get worker name
  const worker = await prisma.worker.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  const checkInTime = new Date();

  // Calculate late status
  const lateMinutes = calculateLateMinutes(job.scheduledTime, checkInTime);
  const isLate = lateMinutes > 0;

  // Calculate distance from job location
  const jobLat = Number(job.locationLat);
  const jobLng = Number(job.locationLng);
  const distance = calculateDistance(lat, lng, jobLat, jobLng);
  const isOutOfRange = distance > job.locationRadius;

  // For out of range, require override reason
  if (isOutOfRange && !overrideReason) {
    return NextResponse.json(
      { error: "Alasan wajib diisi untuk check-in di luar area kerja" },
      { status: 400 }
    );
  }

  // Create or update work session
  await prisma.workSession.upsert({
    where: { jobId_workerId: { jobId: id, workerId: session.user.id } },
    update: {
      checkInAt: checkInTime,
      checkInLat: lat,
      checkInLng: lng,
      isOverrideLocation: isOutOfRange,
      checkInNote: overrideReason ?? null,
      isLate,
      lateMinutes,
    },
    create: {
      jobId: id,
      workerId: session.user.id,
      checkInAt: checkInTime,
      checkInLat: lat,
      checkInLng: lng,
      isOverrideLocation: isOutOfRange,
      checkInNote: overrideReason ?? null,
      isLate,
      lateMinutes,
    },
  });

  if (job.status === "ASSIGNED") {
    await prisma.job.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });
  }

  // Send notification with late/out-of-range info
  await notifyAdminWorkerCheckIn(
    job.id,
    job.slug,
    job.jobNumber,
    worker?.name ?? "Worker",
    job.client.name,
    {
      isLate,
      lateMinutes,
      isOutOfRange,
      distance: Math.round(distance),
      overrideReason: overrideReason ?? null,
    }
  ).catch((err) => {
    console.warn("Failed to send check-in notification:", err);
  });

  return NextResponse.json({ success: true });
}
