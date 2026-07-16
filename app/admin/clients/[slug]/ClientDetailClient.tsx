"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import ClientFormModal from "../ClientFormModal";
import { useToast } from "@/components/Toast";
import Breadcrumb from "@/components/Breadcrumb";
import Modal from "@/components/Modal";

interface RecurringSchedule {
  id: string;
  title: string;
  recurrence: string;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  scheduledTime: string;
  isActive: boolean;
}

interface Job {
  id: string;
  slug: string;
  jobNumber: string;
  title: string;
  status: string;
  scheduledDate: string | Date;
  workers: { worker: { id: string; name: string } }[];
  signature: { id: string } | null;
  report: { id: string } | null;
}

interface ClientData {
  id: string;
  slug: string;
  name: string;
  contactName: string;
  contactTitle: string | null;
  contactPhone: string;
  contactEmail: string | null;
  address: string;
  locationLat?: number | null;
  locationLng?: number | null;
  jobs: Job[];
  recurringSchedules: RecurringSchedule[];
  _count: {
    jobs: number;
    recurringSchedules: number;
  };
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Setiap hari",
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
};

export default function ClientDetailClient({ client }: { client: ClientData }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [jobTab, setJobTab] = useState<"semua" | "selesai" | "pending">("semua");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: client.contactEmail || "", name: client.contactName || "" });
  const [sendingEmail, setSendingEmail] = useState(false);

  async function sendEmail(jobId?: string) {
    if (!emailForm.email || !emailForm.name) {
      showToast("Email dan nama penerima wajib diisi", "warning");
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          recipientEmail: emailForm.email,
          recipientName: emailForm.name,
          includePdf: true,
        }),
      });

      if (res.ok) {
        showToast("Email berhasil dikirim", "success");
        setShowEmailModal(false);
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal mengirim email", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSendingEmail(false);
  }

  function getCompletedJobs() {
    return client.jobs.filter((j) => j.status === "COMPLETED" || j.status === "INVOICED").length;
  }

  function getPendingJobs() {
    return client.jobs.filter((j) => ["DRAFT", "ASSIGNED", "IN_PROGRESS"].includes(j.status)).length;
  }

  function formatRecurrence(s: RecurringSchedule): string {
    const parts: string[] = [RECURRENCE_LABELS[s.recurrence] || s.recurrence];
    if (s.recurrence === "WEEKLY" && s.daysOfWeek?.length) {
      parts.push(`(${s.daysOfWeek.map((d) => DAYS[d]).join(", ")})`);
    }
    if (s.recurrence === "MONTHLY" && s.dayOfMonth) {
      parts.push(`(tanggal ${s.dayOfMonth})`);
    }
    parts.push(`@ ${s.scheduledTime}`);
    return parts.join(" ");
  }

  return (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: "Klien", href: "/admin/clients" },
          { label: client.name },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients" className="p-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">{client.name}</h1>
          <p className="text-sm font-mono mt-0.5" style={{ color: "#94A3B8" }}>
            {client._count.jobs} job{client._count.jobs !== 1 ? "" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="text-sm border px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            style={{ borderColor: "#D97706", color: "#D97706" }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Job" value={client._count.jobs} accent="slate" />
        <StatCard label="Selesai" value={getCompletedJobs()} accent="green" />
        <StatCard label="Pending" value={getPendingJobs()} accent="amber" />
        <StatCard label="Jadwal Otomatis" value={client._count.recurringSchedules} accent="sky" />
      </div>

      {/* Contact info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" style={{ color: "#D97706" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
          </svg>
          Informasi Kontak
        </h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500 text-xs">Nama Kontak</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{client.contactName || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Jabatan</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{client.contactTitle || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Telepon</dt>
            <dd className="font-medium text-slate-900 mt-0.5 flex items-center gap-1.5">
              {client.contactPhone || "—"}
              {client.contactPhone && (
                <a
                  href={`https://wa.me/${client.contactPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700"
                  title="Chat WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Email</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{client.contactEmail || "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-slate-500 text-xs">Alamat</dt>
            <dd className="font-medium text-slate-900 mt-0.5">{client.address || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Recurring schedules */}
      {client.recurringSchedules.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: "#D97706" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Jadwal Otomatis ({client.recurringSchedules.length})
            </h2>
            <Link href="/admin/recurring" className="text-xs font-semibold hover:underline" style={{ color: "#D97706" }}>
              Kelola →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {client.recurringSchedules.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{s.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                    {formatRecurrence(s)}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: "#D97706" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            Riwayat Job ({client.jobs.length})
          </h2>
          <Link href={`/admin/jobs?client=${client.slug}`} className="text-xs font-semibold hover:underline" style={{ color: "#D97706" }}>
            Semua job →
          </Link>
        </div>
        {client.jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Belum ada job.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">No. Job</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">Judul</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">Worker</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">Tanggal</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 text-xs">Status</th>
                  <th className="text-center px-5 py-3 font-medium text-slate-600 text-xs">TTD</th>
                  <th className="text-center px-5 py-3 font-medium text-slate-600 text-xs">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {client.jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{job.jobNumber}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/jobs/${job.slug}`} className="font-medium text-slate-900 hover:underline" style={{ textDecorationColor: "#D97706" }}>
                        {job.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {job.workers.length > 0 ? (
                        <span title={job.workers.map((w) => w.worker.name).join(", ")}>
                          {job.workers.length} orang
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(job.scheduledDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      {job.signature ? (
                        <span title="Sudah ditandatangani" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                          <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-block w-5 h-5" />
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {job.report ? (
                        <button
                          onClick={() => {
                            if (client.contactEmail && client.contactName) {
                              setShowEmailModal(true);
                            } else {
                              window.open(`/api/report/${job.id}/pdf`, "_blank");
                            }
                          }}
                          className="text-xs font-medium hover:underline" style={{ color: "#D97706" }}
                          title="Download atau kirim PDF"
                        >
                          Download
                        </button>
                      ) : (
                        <span className="inline-block w-5 h-5" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <ClientFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => { router.refresh(); setShowEditModal(false); showToast("Klien berhasil disimpan!", "success"); }}
        client={client}
      />

      {/* Email modal */}
      {showEmailModal && (
        <Modal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          title="Kirim Laporan via Email"
          subtitle="Kirim laporan job ke email klien"
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const completedJob = client.jobs.find((j) => j.status === "COMPLETED" || j.status === "INVOICED");
                  if (completedJob) sendEmail(completedJob.id);
                }}
                disabled={sendingEmail}
                className="flex-1 btn-primary px-5 py-2.5 font-semibold rounded-xl disabled:opacity-50"
              >
                {sendingEmail ? "Mengirim..." : "Kirim Email"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Penerima *</label>
              <input
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                placeholder="email@perusahaan.com"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penerima *</label>
              <input
                type="text"
                value={emailForm.name}
                onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                placeholder="Nama lengkap penerima"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: {
  label: string;
  value: number;
  accent: "green" | "amber" | "sky" | "slate";
}) {
  const styles = {
    green: { bg: "#DCFCE7", text: "#16A34A" },
    amber: { bg: "#FEF3C7", text: "#D97706" },
    sky:   { bg: "#E0F2FE", text: "#0EA5E9" },
    slate: { bg: "#F1F5F9", text: "#475569" },
  };
  const s = styles[accent];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <div className="text-2xl font-bold mb-1" style={{ color: s.text }}>{value}</div>
      <div className="text-xs font-medium" style={{ color: "#64748B" }}>{label}</div>
    </div>
  );
}
