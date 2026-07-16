import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToSupabase } from "@/lib/storage";
import { notifyAdminJobCompleted, notifyAdminClientSigned } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { signerName, signerTitle, signatureDataUrl } = await req.json();

  if (!signerName || !signatureDataUrl) {
    return NextResponse.json({ error: "Nama dan tanda tangan wajib diisi" }, { status: 400 });
  }

  let signatureUrl = signatureDataUrl;

  // Upload signature to Supabase Storage if it's a base64 data URL
  if (signatureDataUrl.startsWith("data:")) {
    try {
      const base64Data = signatureDataUrl.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      const storagePath = `signatures/${id}/${Date.now()}.png`;
      signatureUrl = await uploadToSupabase(buffer, "signatures", storagePath, "image/png");
    } catch (err) {
      console.warn("Supabase signature upload failed, storing base64 directly:", err);
    }
  }

  await prisma.clientSignature.upsert({
    where: { jobId: id },
    update: {
      signerName,
      signerTitle: signerTitle ?? "",
      signatureUrl,
      signedAt: new Date(),
      isPendingSign: false,
    },
    create: {
      jobId: id,
      signerName,
      signerTitle: signerTitle ?? "",
      signatureUrl,
      signedAt: new Date(),
      isPendingSign: false,
    },
  });

  await prisma.job.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  await prisma.jobReport.upsert({
    where: { jobId: id },
    update: {},
    create: {
      jobId: id,
      pdfUrl: `/api/report/${id}/pdf`,
      generatedAt: new Date(),
    },
  });

  // Get job details for notifications
  const job = await prisma.job.findUnique({
    where: { id },
    select: { id: true, slug: true, jobNumber: true, title: true, client: { select: { name: true } } },
  });

  // Send WhatsApp notifications to admin/supervisor
  if (job) {
    await notifyAdminClientSigned(id, job.slug, job.jobNumber, signerName, signerTitle ?? "").catch((err) => {
      console.warn("Failed to send client signed notification:", err);
    });

    await notifyAdminJobCompleted(id, job.slug, job.jobNumber, job.title, job.client.name).catch((err) => {
      console.warn("Failed to send job completed notification:", err);
    });
  }

  return NextResponse.json({ success: true });
}
