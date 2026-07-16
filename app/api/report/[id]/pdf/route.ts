import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPDF } from "@/components/ReportPDF";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      areas: {
        orderBy: { sortOrder: "asc" },
        include: { items: true, photos: { orderBy: { takenAt: "asc" } } },
      },
      workers: {
        include: { worker: { select: { id: true, name: true, phone: true } } },
      },
      signature: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const completedItems = job.areas.flatMap(a => a.items).filter(i => i.isDone).length;
  const totalItems = job.areas.flatMap(a => a.items).length;

  const pdfBuffer = await renderToBuffer(
    ReportPDF({
      job: {
        ...job,
        scheduledDate: job.scheduledDate.toISOString(),
        createdAt: job.createdAt.toISOString(),
      },
      completedItems,
      totalItems,
    })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-${job.jobNumber}.pdf"`,
    },
  });
}
