/**
 * Admin Notification Library
 * Sends WhatsApp + In-app notifications to admin/supervisor on job events
 * Email is reserved for report delivery only (with PDF attachment)
 */

import { sendWhatsAppMessage } from "./wa";
import { prisma } from "./prisma";
import { EventEmitter } from "events";

// Event emitter for real-time notifications
export const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(100);

// Get admin phone from database
async function getAdminPhone(): Promise<string | null> {
  const admin = await prisma.worker.findFirst({
    where: { role: "ADMIN" },
    select: { phone: true },
  });
  return admin?.phone ?? null;
}

// Get supervisor phones from database
async function getSupervisorPhones(): Promise<string[]> {
  const supervisors = await prisma.worker.findMany({
    where: { role: "SUPERVISOR" },
    select: { phone: true },
  });
  return supervisors.map((s) => s.phone);
}

/**
 * Send notification to all admins and supervisors via WhatsApp
 */
async function notifyViaWhatsApp(message: string): Promise<void> {
  const adminPhone = await getAdminPhone();
  const supervisorPhones = await getSupervisorPhones();
  const allPhones = [adminPhone, ...supervisorPhones].filter(Boolean) as string[];

  // Remove duplicates
  const uniquePhones = [...new Set(allPhones)];

  // Send to all in parallel
  await Promise.all(
    uniquePhones.map((phone) =>
      sendWhatsAppMessage(phone, message).catch((err) => {
        console.warn(`WhatsApp notification failed for ${phone}:`, err);
      })
    )
  );
}

/**
 * Broadcast notification to all connected SSE clients
 */
function broadcastNotification(notification: {
  id: string;
  type: string;
  title: string;
  message: string;
  jobSlug?: string | null;
  jobNumber?: string | null;
  isRead: boolean;
  createdAt: Date;
}): void {
  notificationEmitter.emit("notification", notification);
}

/**
 * Worker checked in notification
 */
interface CheckInDetails {
  isLate: boolean;
  lateMinutes: number;
  isOutOfRange: boolean;
  distance: number;
  overrideReason: string | null;
}

export async function notifyAdminWorkerCheckIn(
  jobId: string,
  jobSlug: string,
  jobNumber: string,
  workerName: string,
  clientName: string,
  details?: CheckInDetails
): Promise<void> {
  const timestamp = new Date().toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build notification message based on conditions
  let statusEmoji = "✅";
  let statusText = "Check-in";
  let detailsText = "";

  if (details?.isLate) {
    statusEmoji = "⚠️";
    statusText = "Check-in Terlambat";
    detailsText += `\n⏰ Terlambat: ${details.lateMinutes} menit`;
  }

  if (details?.isOutOfRange) {
    statusEmoji = "📍";
    if (detailsText) {
      statusText += " & Lokasi Salah";
    } else {
      statusText = "Check-in Di Luar Area";
    }
    detailsText += `\n📏 Jarak: ${details.distance}m dari lokasi job`;
  }

  if (details?.overrideReason) {
    detailsText += `\n📝 Alasan: ${details.overrideReason}`;
  }

  const whatsappMessage = `${statusEmoji} *${statusText}*

Worker *${workerName}* telah check-in untuk job:
📋 ${jobNumber}
🏢 ${clientName}

⏰ Waktu: ${timestamp}${detailsText}

Buka aplikasi untuk detail.`;

  // Save to database for in-app notifications
  const notification = await prisma.adminNotification.create({
    data: {
      type: "WORKER_CHECKIN",
      title: statusText,
      message: `${workerName} check-in untuk ${jobNumber}${details?.isLate ? ` (Terlambat ${details.lateMinutes} menit)` : ""}${details?.isOutOfRange ? ` (${details.distance}m dari area)` : ""}`,
      jobId,
      jobSlug,
      jobNumber,
      sentVia: ["WHATSAPP", "IN_APP"],
    },
  });

  // Broadcast to SSE clients
  broadcastNotification({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    jobSlug: notification.jobSlug,
    jobNumber: notification.jobNumber,
    isRead: false,
    createdAt: notification.createdAt,
  });

  // Send WhatsApp
  await notifyViaWhatsApp(whatsappMessage);
}

/**
 * Job completed notification
 */
export async function notifyAdminJobCompleted(
  jobId: string,
  jobSlug: string,
  jobNumber: string,
  title: string,
  clientName: string
): Promise<void> {
  const whatsappMessage = `✅ *Job Completed*

Job telah selesai:
📋 ${jobNumber}
📝 ${title}
🏢 ${clientName}

Segera generate PDF dan kirim ke klien untuk invoice.`;

  // Send via WhatsApp only (email reserved for report delivery)
  await notifyViaWhatsApp(whatsappMessage);

  const notification = await prisma.adminNotification.create({
    data: {
      type: "JOB_COMPLETED",
      title: "Job Completed",
      message: `${title} (${jobNumber}) untuk ${clientName}`,
      jobId,
      jobSlug,
      jobNumber,
      sentVia: ["WHATSAPP", "IN_APP"],
    },
  });

  broadcastNotification({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    jobSlug: notification.jobSlug,
    jobNumber: notification.jobNumber,
    isRead: false,
    createdAt: notification.createdAt,
  });
}

/**
 * Client signed notification
 */
export async function notifyAdminClientSigned(
  jobId: string,
  jobSlug: string,
  jobNumber: string,
  signerName: string,
  signerTitle: string
): Promise<void> {
  const whatsappMessage = `✍️ *Tanda Tangan Klien*

Tanda tangan diterima dari:
👤 ${signerName}
📌 ${signerTitle}
📋 ${jobNumber}

Job siap untuk di-invoice!`;

  // Send via WhatsApp only (email reserved for report delivery)
  await notifyViaWhatsApp(whatsappMessage);

  const notification = await prisma.adminNotification.create({
    data: {
      type: "CLIENT_SIGNED",
      title: "Tanda Tangan Klien",
      message: `${signerName} (${signerTitle}) menandatangani ${jobNumber}`,
      jobId,
      jobSlug,
      jobNumber,
      sentVia: ["WHATSAPP", "IN_APP"],
    },
  });

  broadcastNotification({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    jobSlug: notification.jobSlug,
    jobNumber: notification.jobNumber,
    isRead: false,
    createdAt: notification.createdAt,
  });
}

/**
 * Job overdue notification
 */
export async function notifyAdminJobOverdue(
  jobId: string,
  jobSlug: string,
  jobNumber: string,
  title: string,
  clientName: string,
  scheduledTime: string
): Promise<void> {
  const whatsappMessage = `⚠️ *Job Overdue*

Worker belum check-in untuk job:
📋 ${jobNumber}
📝 ${title}
🏢 ${clientName}
🕐 Jadwal: ${scheduledTime}

Segera follow-up dengan worker terkait!`;

  // Send via WhatsApp only (email reserved for report delivery)
  await notifyViaWhatsApp(whatsappMessage);

  const notification = await prisma.adminNotification.create({
    data: {
      type: "JOB_OVERDUE",
      title: "Job Overdue",
      message: `${title} (${jobNumber}) - belum check-in jam ${scheduledTime}`,
      jobId,
      jobSlug,
      jobNumber,
      sentVia: ["WHATSAPP", "IN_APP"],
    },
  });

  broadcastNotification({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    jobSlug: notification.jobSlug,
    jobNumber: notification.jobNumber,
    isRead: false,
    createdAt: notification.createdAt,
  });
}

/**
 * Report sent notification
 */
export async function notifyAdminReportSent(
  jobId: string,
  jobSlug: string,
  jobNumber: string,
  recipientEmail: string
): Promise<void> {
  const whatsappMessage = `📧 *Report Terkirim*

PDF report berhasil dikirim:
📋 ${jobNumber}
📧 Ke: ${recipientEmail}

Job ${jobNumber} selesai!`;

  // Send via WhatsApp only (email reserved for report delivery)
  await notifyViaWhatsApp(whatsappMessage);

  const notification = await prisma.adminNotification.create({
    data: {
      type: "REPORT_SENT",
      title: "Report Terkirim",
      message: `PDF ${jobNumber} dikirim ke ${recipientEmail}`,
      jobId,
      jobSlug,
      jobNumber,
      sentVia: ["WHATSAPP", "IN_APP"],
    },
  });

  broadcastNotification({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    jobSlug: notification.jobSlug,
    jobNumber: notification.jobNumber,
    isRead: false,
    createdAt: notification.createdAt,
  });
}

/**
 * Job assigned notification - sent when workers are assigned to a job
 */
export async function notifyAdminJobAssigned(
  jobId: string,
  jobSlug: string,
  jobNumber: string,
  title: string,
  clientName: string,
  workerNames: string[],
  scheduledDate: string,
  scheduledTime: string
): Promise<void> {
  const workersList = workerNames.join(", ");
  const whatsappMessage = `📋 *Job Ditugaskan*

Job baru ditugaskan ke worker:
📋 ${jobNumber}
📝 ${title}
🏢 ${clientName}
👷 Worker: ${workersList}
📅 ${scheduledDate} @ ${scheduledTime}

Worker akan menerima notifikasi WA.`;

  // Send via WhatsApp only (email reserved for report delivery)
  await notifyViaWhatsApp(whatsappMessage);

  const notification = await prisma.adminNotification.create({
    data: {
      type: "JOB_ASSIGNED",
      title: "Job Ditugaskan",
      message: `${title} → ${workersList} (${scheduledDate})`,
      jobId,
      jobSlug,
      jobNumber,
      sentVia: ["WHATSAPP", "IN_APP"],
    },
  });

  broadcastNotification({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    jobSlug: notification.jobSlug,
    jobNumber: notification.jobNumber,
    isRead: false,
    createdAt: notification.createdAt,
  });
}
