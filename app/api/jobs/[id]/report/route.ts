import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      areas: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: true,
          photos: true,
        },
      },
      workers: {
        include: { worker: true },
      },
      signature: true,
      report: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Return the actual PDF API URL
  const pdfUrl = `/api/report/${id}/pdf`;

  return NextResponse.json({
    ...job,
    report: job.report
      ? { ...job.report, pdfUrl }
      : { pdfUrl },
  });
}
