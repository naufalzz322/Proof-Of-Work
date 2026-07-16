"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";
import Breadcrumb from "@/components/Breadcrumb";
import PhotoComparison from "@/components/PhotoComparison";
import StatusBadge from "@/components/StatusBadge";

interface AreaPhoto { id: string; url: string; type: string }
interface ChecklistItem { id: string; label: string; isDone: boolean }
interface JobArea {
  id: string;
  name: string;
  sortOrder: number;
  items: ChecklistItem[];
  photos: AreaPhoto[];
}
interface Worker { id: string; name: string; phone: string }
interface WorkSession {
  id: string;
  worker: Worker;
  checkInAt: string | null;
  isOverrideLocation?: boolean;
  checkInNote?: string | null;
  isLate?: boolean;
  lateMinutes?: number;
}
interface Signature { id: string; signerName: string; signerTitle: string; signedAt: string; signatureUrl: string }
interface Job {
  id: string;
  slug: string;
  jobNumber: string;
  title: string;
  description: string | null;
  locationAddress: string | null;
  locationLat: number | null;
  locationLng: number | null;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  notes: string | null;
  client: {
    id: string;
    slug: string;
    name: string;
    contactEmail: string | null;
    contactName: string | null;
  };
  areas: JobArea[];
  workers: WorkSession[];
  signature: Signature | null;
  report: { id: string; generatedAt: string; sentAt: string | null; sentToEmail: string | null } | null;
}

interface Props {
  job: Job;
}

export default function SupervisorJobDetail({ job: initialJob }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [job, setJob] = useState(initialJob);
  const [showEdit, setShowEdit] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showPhotoComparison, setShowPhotoComparison] = useState<{ beforeUrl: string; afterUrl: string } | null>(null);

  // Edit form state
  const getLocalDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-CA');
  const [editForm, setEditForm] = useState({
    scheduledDate: getLocalDate(initialJob.scheduledDate),
    scheduledTime: initialJob.scheduledTime,
    notes: initialJob.notes || "",
    status: initialJob.status,
  });

  // Email form state
  const [emailForm, setEmailForm] = useState({
    email: initialJob.report?.sentToEmail || initialJob.client.contactEmail || "",
    name: initialJob.client.contactName || "",
  });

  const completedItems = job.areas.flatMap(a => a.items).filter(i => i.isDone).length;
  const totalItems = job.areas.flatMap(a => a.items).length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: editForm.scheduledDate,
          scheduledTime: editForm.scheduledTime,
          notes: editForm.notes,
          status: editForm.status,
        }),
      });

      if (res.ok) {
        showToast("Job berhasil diperbarui", "success");
        router.refresh();
        const jobRes = await fetch(`/api/admin/jobs/${job.id}`);
        if (jobRes.ok) {
          const updatedJob = await jobRes.json();
          setJob(updatedJob);
        }
        setShowEdit(false);
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal memperbarui job", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSaving(false);
  };

  const handleSendEmail = async () => {
    if (!emailForm.email || !emailForm.name) {
      showToast("Email dan nama penerima wajib diisi", "warning");
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          recipientEmail: emailForm.email,
          recipientName: emailForm.name,
        }),
      });

      if (res.ok) {
        showToast("Laporan berhasil dikirim ke email!", "success");
        router.refresh();
        setShowEmail(false);
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal mengirim email", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSendingEmail(false);
  };

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Monitoring", href: "/supervisor/jobs" },
          { label: job.title },
        ]}
        showHome={false}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/supervisor/jobs" className="p-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-2xl text-slate-900 tracking-tight">{job.title}</h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm font-mono mt-0.5" style={{ color: "#94A3B8" }}>{job.jobNumber}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEdit(true)}
            className="text-sm border px-4 py-2 rounded-xl font-medium hover:bg-amber-50 transition-colors"
            style={{ borderColor: "#D97706", color: "#D97706" }}
          >
            Edit
          </button>
        </div>
        {job.report && (
          <>
            <a href={`/api/report/${job.id}/pdf`} download={`report-${job.jobNumber}.pdf`} className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">
              Download PDF
            </a>
            <button
              onClick={() => setShowEmail(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "#0284C7" }}
            >
              Kirim ke Email
            </button>
            <Link href={`/report/${job.slug}`} target="_blank" className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#16A34A" }}>
              Lihat Report
            </Link>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {job.status !== "DRAFT" && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Progress Checklist</span>
            <span className="text-sm font-bold text-slate-900">{progress}%</span>
          </div>
          <div className="w-full rounded-full h-2.5" style={{ background: "#E2E8F0" }}>
            <div className="h-2.5 rounded-full transition-all" style={{ width: `${progress}%`, background: "#D97706" }} />
          </div>
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{completedItems} dari {totalItems} tugas selesai</p>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Job Information */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 pb-2 mb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
            Informasi Job
          </h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-500">Klien</dt><dd className="font-semibold text-slate-900">{job.client.name}</dd></div>
            <div><dt className="text-slate-500">Deskripsi</dt><dd className="font-semibold text-slate-900">{job.description || "—"}</dd></div>
            <div><dt className="text-slate-500">Lokasi</dt><dd className="font-semibold text-slate-900">{job.locationAddress || "—"}</dd></div>
            <div>
              <dt className="text-slate-500">Jadwal</dt>
              <dd className="font-medium text-slate-900">
                {new Date(job.scheduledDate).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {" · "}{job.scheduledTime}
              </dd>
            </div>
            {job.notes && <div><dt className="text-slate-500">Catatan</dt><dd className="font-medium text-slate-900">{job.notes}</dd></div>}
          </dl>
        </div>

        {/* Workers */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 pb-2 mb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
            Worker ({job.workers.length})
          </h2>
          {job.workers.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada worker ditugaskan.</p>
          ) : (
            <div className="space-y-3">
              {job.workers.map(session => (
                <div key={session.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "#D97706" }}>
                    {session.worker.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{session.worker.name}</p>
                      {session.checkInAt ? (
                        session.isLate ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                            Terlambat {session.lateMinutes} menit
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">On time</span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">Belum check-in</span>
                      )}
                    </div>
                    {session.checkInAt && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Check-in: {new Date(session.checkInAt).toLocaleString("id-ID")}
                      </p>
                    )}
                    {session.isOverrideLocation && session.checkInNote && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs text-amber-800">
                          <span className="font-medium">Alasan di luar area:</span> {session.checkInNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Area & Checklist */}
      <div className="card overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <h2 className="font-semibold text-slate-900">Area & Checklist ({job.areas.length})</h2>
        </div>
        {job.areas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">Belum ada area.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {job.areas.map(area => {
              const areaDone = area.items.filter(i => i.isDone).length;
              const beforePhoto = area.photos.find(p => p.type === "BEFORE");
              const afterPhoto = area.photos.find(p => p.type === "AFTER");
              const hasBoth = beforePhoto && afterPhoto;
              return (
                <div key={area.id} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{area.name}</h3>
                    <span className="text-xs text-slate-500">{areaDone}/{area.items.length} selesai</span>
                  </div>
                  <div className="space-y-1.5">
                    {area.items.map(item => (
                      <div key={item.id} className={`flex items-center gap-2 text-sm ${item.isDone ? "text-green-600" : "text-slate-500"}`}>
                        <span>{item.isDone ? "✓" : "○"}</span>
                        <span className={item.isDone ? "line-through" : ""}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  {area.photos.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {area.photos.map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => {
                            if (hasBoth) {
                              setShowPhotoComparison({ beforeUrl: beforePhoto!.url, afterUrl: afterPhoto!.url });
                            }
                          }}
                          className={`relative group ${hasBoth ? "cursor-pointer hover:ring-2 hover:ring-amber-400 rounded-lg" : "cursor-default"}`}
                          disabled={!hasBoth}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.url} alt={photo.type} className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">{photo.type}</span>
                          {hasBoth && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signature & Report */}
      {(job.signature || job.report) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {job.signature && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 pb-2 mb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
                Tanda Tangan Klien
              </h2>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.signature.signatureUrl} alt="Signature" className="h-16 border border-slate-200 rounded bg-white" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{job.signature.signerName}</p>
                  <p className="text-xs text-slate-500">{job.signature.signerTitle}</p>
                  <p className="text-xs text-slate-500">{new Date(job.signature.signedAt).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>
          )}
          {job.report && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 pb-2 mb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
                Report
              </h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-slate-500">Dibuat</dt><dd className="font-medium">{new Date(job.report.generatedAt).toLocaleString("id-ID")}</dd></div>
                {job.report.sentAt && <div><dt className="text-slate-500">Tercirim ke</dt><dd className="font-medium">{job.report.sentToEmail || "—"}</dd></div>}
                <div className="pt-2">
                  <Link href={`/report/${job.slug}`} target="_blank" className="text-sm bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800 font-medium inline-block">
                    Buka Report
                  </Link>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Job</h2>
              <button onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={editForm.scheduledDate}
                    onChange={e => setEditForm(f => ({ ...f, scheduledDate: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Waktu</label>
                  <input
                    type="time"
                    value={editForm.scheduledTime}
                    onChange={e => setEditForm(f => ({ ...f, scheduledTime: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="ASSIGNED">Ditugaskan</option>
                  <option value="IN_PROGRESS">Sedang Berjalan</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="INVOICED">Ditagih</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  placeholder="Tambahkan catatan..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 flex-shrink-0 bg-white">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">Batal</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-3 btn-primary font-semibold rounded-xl disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmail && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowEmail(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Kirim Laporan ke Email</h2>
              <button onClick={() => setShowEmail(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Penerima *</label>
                <input
                  type="email"
                  value={emailForm.email}
                  onChange={e => setEmailForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="client@company.com"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penerima *</label>
                <input
                  type="text"
                  value={emailForm.name}
                  onChange={e => setEmailForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nama PIC klien"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Job:</strong> {job.title}<br />
                  <strong>No:</strong> {job.jobNumber}<br />
                  <strong>Klien:</strong> {job.client.name}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button onClick={() => setShowEmail(false)} className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">Batal</button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 py-3 font-semibold rounded-xl text-white disabled:opacity-50"
                style={{ background: "#0284C7" }}
              >
                {sendingEmail ? "Mengirim..." : "Kirim Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Comparison Modal */}
      {showPhotoComparison && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoComparison(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Bandingkan Foto Sebelum & Sesudah</h3>
              <button onClick={() => setShowPhotoComparison(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <PhotoComparison
                beforeUrl={showPhotoComparison.beforeUrl}
                afterUrl={showPhotoComparison.afterUrl}
                beforeLabel="Sebelum"
                afterLabel="Sesudah"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
