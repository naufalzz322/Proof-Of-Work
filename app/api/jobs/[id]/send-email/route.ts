import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendReportEmail } from "@/lib/email";
import { notifyAdminReportSent } from "@/lib/notifications";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPDF } from "@/components/ReportPDF";

// Zod validation schema
const SendReportSchema = z.object({
  recipientEmail: z.string().email("Format email tidak valid"),
  recipientName: z.string().min(1, "Nama penerima wajib diisi"),
  includePdf: z.boolean().optional().default(true),
});

/**
 * POST /api/jobs/[id]/send-email
 * Send job report PDF to client via email
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;
    const body = await req.json();

    // Validate input
    const validated = SendReportSchema.parse(body);

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service belum dikonfigurasi. Hubungi administrator." },
        { status: 503 }
      );
    }

    // Fetch full job data with all relations for PDF generation
    const job = await prisma.job.findUnique({
      where: { id: jobId },
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
        report: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
    }

    // Check if job is completed
    if (job.status !== "COMPLETED" && job.status !== "INVOICED") {
      return NextResponse.json(
        { error: "Job harus selesai sebelum mengirim laporan" },
        { status: 400 }
      );
    }

    // Generate PDF buffer if includePdf is true
    let pdfBuffer: Buffer | undefined;
    if (validated.includePdf) {
      try {
        const completedItems = job.areas.flatMap(a => a.items).filter(i => i.isDone).length;
        const totalItems = job.areas.flatMap(a => a.items).length;

        console.log("[SendEmail] Generating PDF for job:", job.jobNumber);

        const pdfUint8Array = await renderToBuffer(
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

        pdfBuffer = Buffer.from(pdfUint8Array);
        console.log("[SendEmail] PDF generated, size:", pdfBuffer.length);
      } catch (err) {
        console.error("[SendEmail] PDF generation error:", err);
        // Continue without PDF if generation fails
      }
    }

    // Send email with PDF attachment
    const result = await sendReportEmail({
      jobId,
      recipientEmail: validated.recipientEmail,
      recipientName: validated.recipientName,
      pdfBuffer,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Gagal mengirim email: ${result.error}` },
        { status: 500 }
      );
    }

    // Send WhatsApp notification to admin/supervisor (fire-and-forget)
    notifyAdminReportSent(
      job.id,
      job.slug,
      job.jobNumber,
      validated.recipientEmail
    ).catch((err) => {
      console.warn("Failed to send report notification:", err);
    });

    return NextResponse.json({
      success: true,
      message: `Laporan berhasil dikirim ke ${validated.recipientEmail}`,
      messageId: result.messageId,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/[id]/send-email
 * Get email preview data
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPERVISOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: true,
        report: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      jobNumber: job.jobNumber,
      title: job.title,
      client: {
        name: job.client.name,
        contactName: job.client.contactName,
        contactEmail: job.client.contactEmail,
      },
      reportGenerated: !!job.report,
      lastSentAt: job.report?.sentAt,
      lastSentTo: job.report?.sentToEmail,
    });

  } catch (error) {
    console.error("Get email preview error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
