const FONNTE_TOKEN = process.env.FONNTE_USERNAME || process.env.FONNTE_TOKEN;
const FONNTE_API_URL = "https://api.fonnte.com/send";

export interface FonnteResponse {
  status: boolean;
  detail?: string;
  id?: number[];
  process?: string;
  quota?: Record<string, { quota: number; remaining: number; used: number }>;
  requestid?: number;
  target?: string[];
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<FonnteResponse> {
  if (!FONNTE_TOKEN) {
    console.warn("Fonnte token not configured");
    return { status: false, detail: "Token not configured" };
  }

  // Send to the actual phone number
  const target = phone.replace(/^0/, "");

  try {
    const res = await fetch(FONNTE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": FONNTE_TOKEN,
      },
      body: new URLSearchParams({
        target: target,
        message: message,
        countryCode: "62",
        typing: "true",
      }),
    });

    const data = (await res.json()) as FonnteResponse;
    return data;
  } catch (err) {
    console.error("Fonnte WA error:", err);
    return { status: false, detail: "Network error" };
  }
}

export async function notifyWorkerNewJob(
  workerPhone: string,
  workerName: string,
  jobTitle: string,
  clientName: string,
  scheduledDate: string,
  scheduledTime: string
): Promise<FonnteResponse> {
  const message = `Halo ${workerName}! Ada penugasan baru untukmu:

📋 ${jobTitle}
🏢 Klien: ${clientName}
📅 Tanggal: ${scheduledDate}
🕐 Jam: ${scheduledTime}

Buka aplikasi untuk detail lebih lanjut.

— Sistem Pytagotech`;
  return sendWhatsAppMessage(workerPhone, message);
}