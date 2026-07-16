/**
 * Email Service — Resend Integration
 * Sends PDF reports to clients via email
 * Email is reserved for report delivery only (with PDF attachment)
 */

import { Resend } from "resend";
import { prisma } from "./prisma";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender config
const FROM_EMAIL = process.env.EMAIL_FROM || "Proof of Work <noreply@pytagotech.com>";
const COMPANY_NAME = "Pytagotech";
const COMPANY_URL = "https://pytagotech.com";

// Color palette - consistent with app design
const COLORS = {
  primary: "#D97706",      // Amber-600
  primaryDark: "#B45309",  // Amber-700
  primaryLight: "#FEF3C7", // Amber-100
  success: "#16A34A",       // Green-600
  successLight: "#DCFCE7",  // Green-100
  textDark: "#1E293B",      // Slate-800
  textMuted: "#64748B",     // Slate-500
  textLight: "#94A3B8",     // Slate-400
  bgLight: "#F8FAFC",      // Slate-50
  border: "#E2E8F0",       // Slate-200
  white: "#FFFFFF",
};

interface SendReportEmailParams {
  jobId: string;
  recipientEmail: string;
  recipientName: string;
  pdfBuffer?: Buffer;
}

/**
 * Generate SVG icon as inline data URI
 */
function getIconDataUri(name: string, color: string): string {
  const icons: Record<string, string> = {
    clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
    paperclip: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`,
  };
  return icons[name] || "";
}

/**
 * Send job report PDF to client via email
 */
export async function sendReportEmail({
  jobId,
  recipientEmail,
  recipientName,
  pdfBuffer,
}: SendReportEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Fetch job data with related info
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: true,
        areas: {
          include: { items: true, photos: true },
        },
        workers: { include: { worker: true } },
        signature: true,
        report: true,
      },
    });

    if (!job) {
      return { success: false, error: "Job not found" };
    }

    // Calculate completion stats
    const totalAreas = job.areas.length;
    const totalItems = job.areas.flatMap((a) => a.items).length;
    const completedItems = job.areas.flatMap((a) => a.items).filter((i) => i.isDone).length;
    const totalPhotos = job.areas.flatMap((a) => a.photos).length;
    const completionPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Format date
    const scheduledDate = new Date(job.scheduledDate).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Build email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Pekerjaan - ${job.jobNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${COLORS.bgLight}; color: ${COLORS.textDark}; line-height: 1.6;">

  <!-- Preview Text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Laporan Pekerjaan ${job.jobNumber} - ${job.title}
  </div>

  <!-- Outer Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.bgLight}; padding: 40px 20px;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${COLORS.primary}; padding: 32px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <!-- Logo / Brand Icon -->
                  <td width="48" valign="top" style="padding-right: 16px;">
                    <div style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                      <div style="width: 24px; height: 24px;">
                        ${getIconDataUri("clipboard", "#FFFFFF")}
                      </div>
                    </div>
                  </td>
                  <!-- Title -->
                  <td>
                    <h1 style="margin: 0; color: ${COLORS.white}; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                      Laporan Pekerjaan
                    </h1>
                    <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 13px; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                      ${job.jobNumber}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Area -->
          <tr>
            <td style="padding: 32px;">

              <!-- Greeting -->
              <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.textMuted};">
                Yth. <strong style="color: ${COLORS.textDark};">${recipientName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.7;">
                Terima kasih telah menggunakan layanan kami. Berikut adalah laporan pekerjaan yang telah diselesaikan. Dokumen ini berisi bukti completion berupa foto, checklist, dan tanda tangan sebagai verifikasi.
              </p>

              <!-- Job Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.primaryLight}; border-radius: 12px; border: 1px solid #FDE68A; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; color: ${COLORS.primaryDark}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                      Detail Pekerjaan
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #FDE68A;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="80" style="vertical-align: top;">
                                <span style="color: ${COLORS.textMuted}; font-size: 12px;">Judul</span>
                              </td>
                              <td>
                                <strong style="color: ${COLORS.textDark}; font-size: 15px;">${job.title}</strong>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #FDE68A;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="80" style="vertical-align: top;">
                                <span style="color: ${COLORS.textMuted}; font-size: 12px;">Klien</span>
                              </td>
                              <td>
                                <strong style="color: ${COLORS.textDark}; font-size: 15px;">${job.client.name}</strong>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #FDE68A;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="80" style="vertical-align: top;">
                                <span style="color: ${COLORS.textMuted}; font-size: 12px;">Lokasi</span>
                              </td>
                              <td>
                                <span style="color: ${COLORS.textDark}; font-size: 14px;">${job.locationAddress || "-"}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-top: 1px solid #FDE68A;">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td width="80" style="vertical-align: top;">
                                <span style="color: ${COLORS.textMuted}; font-size: 12px;">Tanggal</span>
                              </td>
                              <td>
                                <span style="color: ${COLORS.textDark}; font-size: 14px;">${scheduledDate} · ${job.scheduledTime}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Stats Row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <!-- Progress Box -->
                  <td width="33%" style="padding-right: 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.bgLight}; border-radius: 10px; border: 1px solid ${COLORS.border}; text-align: center; padding: 16px;">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${completionPercent === 100 ? COLORS.success : COLORS.primary};">
                            ${completionPercent}%
                          </p>
                          <p style="margin: 4px 0 0; font-size: 11px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                            Complete
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Area Count -->
                  <td width="33%" style="padding: 0 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.bgLight}; border-radius: 10px; border: 1px solid ${COLORS.border}; text-align: center; padding: 16px;">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${COLORS.textDark};">
                            ${totalAreas}
                          </p>
                          <p style="margin: 4px 0 0; font-size: 11px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                            Area
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Checklist Count -->
                  <td width="34%" style="padding-left: 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.bgLight}; border-radius: 10px; border: 1px solid ${COLORS.border}; text-align: center; padding: 16px;">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${COLORS.textDark};">
                            ${completedItems}/${totalItems}
                          </p>
                          <p style="margin: 4px 0 0; font-size: 11px; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">
                            Checklist
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Progress Bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="width: 100%; height: 8px; background-color: ${COLORS.border}; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${completionPercent}%; height: 100%; background-color: ${completionPercent === 100 ? COLORS.success : COLORS.primary}; border-radius: 4px;"></div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Areas Section Header -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td>
                    <h3 style="margin: 0; color: ${COLORS.textDark}; font-size: 15px; font-weight: 700;">
                      Ringkasan Area Kerja
                    </h3>
                  </td>
                  <td align="right">
                    <span style="color: ${COLORS.textMuted}; font-size: 13px;">${totalPhotos} foto</span>
                  </td>
                </tr>
              </table>

              <!-- Areas List -->
              ${job.areas.map((area) => {
                const areaCompleted = area.items.filter((i) => i.isDone).length;
                const areaTotal = area.items.length;
                const areaPercent = areaTotal > 0 ? Math.round((areaCompleted / areaTotal) * 100) : 0;
                return `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.bgLight}; border-radius: 10px; border: 1px solid ${COLORS.border}; margin-bottom: 12px;">
                <tr>
                  <td style="padding: 16px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <strong style="color: ${COLORS.textDark}; font-size: 14px;">${area.name}</strong>
                        </td>
                        <td align="right">
                          <span style="background-color: ${areaPercent === 100 ? COLORS.successLight : COLORS.primaryLight}; color: ${areaPercent === 100 ? COLORS.success : COLORS.primaryDark}; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">
                            ${areaPercent === 100 ? 'Selesai' : `${areaCompleted}/${areaTotal} selesai`}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 12px;">
                          <div style="width: 100%; height: 4px; background-color: ${COLORS.border}; border-radius: 2px; overflow: hidden;">
                            <div style="width: ${areaPercent}%; height: 100%; background-color: ${areaPercent === 100 ? COLORS.success : COLORS.primary}; border-radius: 2px;"></div>
                          </div>
                        </td>
                      </tr>
                      ${area.items.slice(0, 4).map((item) => `
                      <tr>
                        <td colspan="2" style="padding-top: 8px;">
                          <span style="color: ${item.isDone ? COLORS.success : COLORS.textLight}; font-size: 13px; margin-right: 8px;">${item.isDone ? '[' + getIconDataUri("check", COLORS.success).replace('width="16"', 'width="14"').replace('height="16"', 'height="14"') + ']' : '[ ]'}</span>
                          <span style="color: ${item.isDone ? COLORS.textMuted : COLORS.textDark}; font-size: 13px; ${item.isDone ? 'text-decoration: line-through;' : ''}">${item.label}</span>
                        </td>
                      </tr>
                      `).join('')}
                      ${area.items.length > 4 ? `
                      <tr>
                        <td colspan="2" style="padding-top: 8px;">
                          <span style="color: ${COLORS.textMuted}; font-size: 12px; font-style: italic;">+${area.items.length - 4} item lainnya</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
                `;
              }).join('')}

              <!-- Signature Section -->
              ${job.signature ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${COLORS.successLight}; border-radius: 10px; border: 1px solid #BBF7D0; margin-top: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="32" style="padding-right: 12px;">
                          <div style="width: 32px; height: 32px; background-color: ${COLORS.success}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <div style="width: 16px; height: 16px;">
                              ${getIconDataUri("check", "#FFFFFF")}
                            </div>
                          </div>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${COLORS.success};">
                            Laporan Disetujui
                          </p>
                          <p style="margin: 2px 0 0; font-size: 13px; color: #166534;">
                            Ditandatangani oleh <strong>${job.signature.signerName}</strong> · ${job.signature.signerTitle}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- PDF Attachment Section -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #EFF6FF; border-radius: 10px; border: 1px solid #BFDBFE; margin-top: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="36" style="padding-right: 12px;">
                          <div style="width: 36px; height: 36px; background-color: #3B82F6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <div style="width: 18px; height: 18px;">
                              ${getIconDataUri("paperclip", "#FFFFFF")}
                            </div>
                          </div>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1E40AF;">
                            Laporan Lengkap (PDF)
                          </p>
                          <p style="margin: 2px 0 0; font-size: 12px; color: #3B82F6;">
                            ${pdfBuffer ? "File PDF terlampir di email ini" : "PDF akan dikirimkan terpisah"}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: ${COLORS.border};"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLORS.bgLight}; padding: 32px; text-align: center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom: 16px;">
                <tr>
                  <td width="36" style="padding-right: 12px;">
                    <div style="width: 36px; height: 36px; background-color: ${COLORS.primary}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                      <div style="width: 18px; height: 18px;">
                        ${getIconDataUri("clipboard", "#FFFFFF")}
                      </div>
                    </div>
                  </td>
                  <td style="text-align: left;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${COLORS.textDark};">
                      ${COMPANY_NAME}
                    </p>
                    <p style="margin: 2px 0 0; font-size: 12px; color: ${COLORS.textMuted};">
                      Proof of Work Generator
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 12px; color: ${COLORS.textMuted};">
                Dokumen ini digenerate secara otomatis.<br>
                Untuk pertanyaan, hubungi kami di <a href="mailto:support@pytagotech.com" style="color: ${COLORS.primary}; text-decoration: none;">support@pytagotech.com</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 11px; color: ${COLORS.textLight};">
                &copy; ${new Date().getFullYear()} ${COMPANY_NAME} · <a href="${COMPANY_URL}" style="color: ${COLORS.textLight}; text-decoration: none;">${COMPANY_URL}</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Container -->

        <!-- Spacing for mobile -->
        <div style="height: 40px;"></div>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    // Prepare attachments
    const attachments = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `Laporan-${job.jobNumber}.pdf`,
        content: pdfBuffer.toString("base64"),
      });
    }

    // Send email
    const reportRecipient = `${recipientName} <${recipientEmail}>`;
    const reportSubject = `Laporan Pekerjaan ${job.jobNumber} - ${job.title}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: reportRecipient,
      subject: reportSubject,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    // Update job report with sent info
    if (job.report) {
      await prisma.jobReport.update({
        where: { id: job.report.id },
        data: {
          sentAt: new Date(),
          sentToEmail: recipientEmail,
        },
      });
    }

    return { success: true, messageId: data?.id };

  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
