"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import Breadcrumb from "@/components/Breadcrumb";
import ConfirmModal from "@/components/ConfirmModal";
import Modal from "@/components/Modal";
import PhotoComparison from "@/components/PhotoComparison";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import dynamic from "next/dynamic";

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center">
      <span className="text-sm" style={{ color: "#94A3B8" }}>Memuat peta...</span>
    </div>
  ),
});

interface Worker { id: string; name: string; phone: string }
interface AreaPhoto { id: string; url: string; type: string }
interface ChecklistItem { id: string; label: string; isDone: boolean }
interface JobArea { id: string; name: string; sortOrder: number; items: ChecklistItem[]; photos: AreaPhoto[] }
interface WorkSession {
  id: string;
  worker: Worker;
  checkInAt: Date | string | null;
  isOverrideLocation?: boolean;
  checkInNote?: string | null;
  isLate?: boolean;
  lateMinutes?: number;
}
interface JobData {
  id: string; slug: string; jobNumber: string; title: string; description: string | null;
  locationAddress: string; locationLat: number | null; locationLng: number | null;
  scheduledDate: string; scheduledTime: string; notes: string | null;
  status: string; client: { id: string; name: string; contactEmail: string | null; contactName: string | null };
  areas: JobArea[]; workers: WorkSession[];
  signature: { id: string; signerName: string; signerTitle: string; signedAt: string; signatureUrl: string } | null;
  report: { id: string; generatedAt: string; sentAt: string | null; sentToEmail: string | null } | null;
}

export default function JobDetailClient({ job: initialJob }: { job: JobData }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [job, setJob] = useState(initialJob);
  const [showEdit, setShowEdit] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);
  const [showAreas, setShowAreas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [allWorkers, setAllWorkers] = useState<{ id: string; name: string; phone: string; status?: string; currentJob?: { title: string } | null }[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [emailForm, setEmailForm] = useState({
    email: initialJob.report?.sentToEmail || initialJob.client.contactEmail || "",
    name: initialJob.client.contactName || "",
  });
  const [editForm, setEditForm] = useState({
    title: initialJob.title,
    description: initialJob.description ?? "",
    clientId: initialJob.client.id,
    locationAddress: initialJob.locationAddress,
    locationLat: typeof initialJob.locationLat === 'number' ? initialJob.locationLat : null,
    locationLng: typeof initialJob.locationLng === 'number' ? initialJob.locationLng : null,
    scheduledDate: new Date(initialJob.scheduledDate).toISOString().slice(0, 10),
    scheduledTime: initialJob.scheduledTime,
    notes: initialJob.notes ?? "",
    status: initialJob.status,
  });
  const [showMap, setShowMap] = useState(false);
  const [showPhotoComparison, setShowPhotoComparison] = useState<{ areaId: string; beforeUrl: string; afterUrl: string } | null>(null);
  const [areasForm, setAreasForm] = useState<{ id?: string; name: string; items: { id?: string; label: string }[] }[]>([]);

  // Check if job can have workers/areas edited
  const canEditWorkersAreas = job.status === "DRAFT" || job.status === "ASSIGNED";

  useEffect(() => {
    if (showEdit && clients.length === 0) {
      fetch("/api/admin/clients").then(r => r.json()).then(setClients);
    }
  }, [showEdit, clients.length]);

  useEffect(() => {
    if (showWorkers) {
      fetch("/api/admin/workers?role=FIELD&withStatus=true")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllWorkers(data);
            setSelectedWorkerIds(job.workers.map(w => w.worker.id));
          }
        });
    }
  }, [showWorkers, job.workers]);

  useEffect(() => {
    if (showAreas) {
      setAreasForm(job.areas.map(a => ({
        id: a.id,
        name: a.name,
        items: a.items.map(i => ({ id: i.id, label: i.label })),
      })));
      if (job.areas.length === 0) {
        setAreasForm([{ name: "", items: [{ label: "" }] }]);
      }
    }
  }, [showAreas, job.areas]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description,
        clientId: editForm.clientId,
        locationAddress: editForm.locationAddress,
        locationLat: editForm.locationLat,
        locationLng: editForm.locationLng,
        scheduledDate: editForm.scheduledDate,
        scheduledTime: editForm.scheduledTime,
        notes: editForm.notes,
        status: editForm.status,
      }),
    });
    if (res.ok) {
      // Refresh Server Component cache first, then fetch latest data
      router.refresh();
      const jobRes = await fetch(`/api/admin/jobs/${job.id}`);
      if (jobRes.ok) {
        const updatedJob = await jobRes.json();
        setJob(updatedJob);
      }
      setShowEdit(false);
      showToast("Job berhasil disimpan!", "success");
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan");
      showToast(data.error ?? "Gagal menyimpan job", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Job berhasil dihapus", "success");
      setShowDeleteConfirm(false);
      router.push("/admin/jobs");
    } else {
      setError("Gagal menghapus job.");
      showToast("Gagal menghapus job", "error");
      setDeleting(false);
    }
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
        setShowEmail(false);
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal mengirim email", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat mengirim email", "error");
    }
    setSendingEmail(false);
  };

  const handleSaveWorkers = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/workers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerIds: selectedWorkerIds }),
      });
      if (res.ok) {
        // Refresh Server Component cache first, then fetch latest data
        router.refresh();
        const jobRes = await fetch(`/api/admin/jobs/${job.id}`);
        if (jobRes.ok) {
          const updatedJob = await jobRes.json();
          setJob(updatedJob);
        }
        showToast("Worker berhasil diperbarui!", "success");
        setShowWorkers(false);
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSaving(false);
  };

  const handleAddArea = () => {
    setAreasForm([...areasForm, { name: "", items: [{ label: "" }] }]);
  };

  const handleRemoveArea = (idx: number) => {
    setAreasForm(areasForm.filter((_, i) => i !== idx));
  };

  const handleUpdateAreaName = (idx: number, name: string) => {
    const updated = [...areasForm];
    updated[idx].name = name;
    setAreasForm(updated);
  };

  const handleAddItem = (areaIdx: number) => {
    const updated = [...areasForm];
    updated[areaIdx].items.push({ label: "" });
    setAreasForm(updated);
  };

  const handleRemoveItem = (areaIdx: number, itemIdx: number) => {
    const updated = [...areasForm];
    updated[areaIdx].items = updated[areaIdx].items.filter((_, i) => i !== itemIdx);
    setAreasForm(updated);
  };

  const handleUpdateItem = (areaIdx: number, itemIdx: number, label: string) => {
    const updated = [...areasForm];
    updated[areaIdx].items[itemIdx].label = label;
    setAreasForm(updated);
  };

  const handleSaveAreas = async () => {
    const validAreas = areasForm.filter(a => a.name.trim() !== "");
    if (validAreas.length === 0) {
      showToast("Minimal harus ada 1 area", "warning");
      return;
    }
    for (const area of validAreas) {
      if (area.items.filter(i => i.label.trim() !== "").length === 0) {
        showToast(`Area "${area.name}" harus punya minimal 1 tugas`, "warning");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/areas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areas: validAreas.map(a => ({
            id: a.id,
            name: a.name,
            items: a.items.filter(i => i.label.trim() !== "").map(i => ({ id: i.id, label: i.label })),
          })),
        }),
      });
      if (res.ok) {
        // Refresh Server Component cache first, then fetch latest data
        router.refresh();
        const jobRes = await fetch(`/api/admin/jobs/${job.id}`);
        if (jobRes.ok) {
          const updatedJob = await jobRes.json();
          setJob(updatedJob);
        }
        showToast("Area & checklist berhasil diperbarui!", "success");
        setShowAreas(false);
      } else {
        const data = await res.json();
        showToast(data.error || "Gagal menyimpan", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setSaving(false);
  };

  const completedItems = job.areas.flatMap(a => a.items).filter(i => i.isDone).length;
  const totalItems = job.areas.flatMap(a => a.items).length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: "Pekerjaan", href: "/admin/jobs" },
          { label: job.title },
        ]}
        showHome={false}
      />

      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/jobs" className="p-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
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
          {canEditWorkersAreas && (
            <>
              <button onClick={() => setShowWorkers(true)} className="text-sm border px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: "#94A3B8", color: "#64748B" }}>
                Ubah Worker
              </button>
              <button onClick={() => setShowAreas(true)} className="text-sm border px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors" style={{ borderColor: "#94A3B8", color: "#64748B" }}>
                Ubah Area
              </button>
            </>
          )}
          <button onClick={() => setShowEdit(true)} className="text-sm border px-4 py-2 rounded-xl font-medium hover:bg-amber-50 transition-colors" style={{ borderColor: "#D97706", color: "#D97706" }}>Edit</button>
          <button onClick={() => setShowDeleteConfirm(true)} className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 font-medium">
            Hapus
          </button>
        </div>
        {job.report && (
          <>
            <a href={`/api/report/${job.id}/pdf`} download={`report-${job.jobNumber}.pdf`} className="btn-primary px-4 py-2 rounded-xl text-sm font-medium">Download PDF</a>
            <button onClick={() => setShowEmail(true)} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#0284C7" }}>Kirim ke Email</button>
            <Link href={`/report/${job.slug}`} target="_blank" className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#16A34A" }}>Lihat Report</Link>
          </>
        )}
      </div>

      {/* DRAFT/ASSIGNED info banner */}
      {job.status === "DRAFT" && job.workers.length === 0 && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "#FEF3C7", border: "1px solid #FCD34D" }}>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#D97706" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 text-sm">Job ini belum lengkap</p>
              <p className="text-xs mt-0.5" style={{ color: "#92400E" }}>
                Klik "Ubah Worker" untuk menugaskan worker, lalu job akan otomatis berubah ke status "Ditugaskan".
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}>{error}</div>}

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 pb-2 mb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>Informasi Job</h2>
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

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <h2 className="font-semibold text-slate-900">Worker ({job.workers.length})</h2>
            {canEditWorkersAreas && (
              <button onClick={() => setShowWorkers(true)} className="text-xs font-semibold" style={{ color: "#D97706" }}>
                + Ubah
              </button>
            )}
          </div>
          {job.workers.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada worker ditugaskan.</p>
          ) : (
            <div className="space-y-3">
              {job.workers.map(session => (
                <div key={session.id} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "#D97706" }}>{session.worker.name.charAt(0).toUpperCase()}</div>
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

      <div className="card overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <h2 className="font-semibold text-slate-900">Area & Checklist ({job.areas.length})</h2>
          {canEditWorkersAreas && (
            <button onClick={() => setShowAreas(true)} className="text-xs font-semibold" style={{ color: "#D97706" }}>
              + Ubah
            </button>
          )}
        </div>
        {job.areas.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-400">Belum ada area. </p>
            {canEditWorkersAreas && (
              <button onClick={() => setShowAreas(true)} className="text-sm font-semibold mt-2" style={{ color: "#D97706" }}>
                + Tambah Area & Checklist
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {job.areas.map(area => {
              const areaDone = area.items.filter(i => i.isDone).length;
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
                      {(() => {
                        const beforePhoto = area.photos.find(p => p.type === "BEFORE");
                        const afterPhoto = area.photos.find(p => p.type === "AFTER");
                        const hasBoth = beforePhoto && afterPhoto;
                        return (
                          <>
                            {area.photos.map(photo => (
                              <button
                                key={photo.id}
                                onClick={() => {
                                  if (hasBoth) {
                                    setShowPhotoComparison({ areaId: area.id, beforeUrl: beforePhoto!.url, afterUrl: afterPhoto!.url });
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
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(job.signature || job.report) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {job.signature && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 pb-2 mb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>Tanda Tangan Klien</h2>
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
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 pb-2 mb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>Report</h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-slate-500">Dibuat</dt><dd className="font-medium">{new Date(job.report.generatedAt).toLocaleString("id-ID")}</dd></div>
                {job.report.sentAt && <div><dt className="text-slate-500">Tercirim ke</dt><dd className="font-medium">{job.report.sentToEmail || "—"}</dd></div>}
                <div className="pt-2">
                  <Link href={`/report/${job.slug}`} target="_blank" className="text-sm bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800 font-medium inline-block">Buka Report</Link>
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
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul *</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Klien *</label>
                <select value={editForm.clientId} onChange={e => setEditForm(f => ({ ...f, clientId: e.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600">
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi</label>
                <AddressAutocomplete
                  value={editForm.locationAddress}
                  onChange={(address) => setEditForm(f => ({ ...f, locationAddress: address }))}
                  onLocationChange={(lat, lng) => setEditForm(f => ({ ...f, locationLat: lat, locationLng: lng }))}
                  placeholder="Ketik alamat, pilih dari saran..."
                />
                {(editForm.locationLat != null && editForm.locationLng != null) && (
                  <p className="text-xs mt-1" style={{ color: "#16A34A" }}>
                    ✓ Lokasi tersimpan: {Number(editForm.locationLat).toFixed(6)}, {Number(editForm.locationLng).toFixed(6)}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className="text-sm font-medium flex items-center gap-2 hover:underline mt-2"
                  style={{ color: "#D97706" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                  {showMap ? "Sembunyikan peta" : "Tampilkan peta"}
                </button>
                {showMap && (
                  <div className="mt-3">
                    <LocationPicker
                      lat={editForm.locationLat}
                      lng={editForm.locationLng}
                      onLocationChange={(lat, lng) => setEditForm(f => ({ ...f, locationLat: lat, locationLng: lng }))}
                      address={editForm.locationAddress}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <input type="date" value={editForm.scheduledDate} onChange={e => setEditForm(f => ({ ...f, scheduledDate: e.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Waktu</label>
                  <input type="time" value={editForm.scheduledTime} onChange={e => setEditForm(f => ({ ...f, scheduledTime: e.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600">
                  <option value="DRAFT">Draft</option>
                  <option value="ASSIGNED">Ditugaskan</option>
                  <option value="IN_PROGRESS">Sedang Berjalan</option>
                  <option value="COMPLETED">Selesai</option>
                  <option value="INVOICED">Ditagih</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 flex-shrink-0 bg-white">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 btn-primary font-semibold rounded-xl disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Workers Modal */}
      {showWorkers && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowWorkers(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white z-10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tugaskan Worker</h2>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                  {job.status === "DRAFT" ? "Worker akan otomatis ditugaskan dan status berubah ke 'Ditugaskan'" : "Pilih worker untuk job ini"}
                </p>
              </div>
              <button onClick={() => setShowWorkers(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {allWorkers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Memuat worker...</p>
              ) : (
                <div className="space-y-2">
                  {allWorkers.map((w) => {
                    const isBusy = w.status === "BUSY";
                    const isCurrentWorker = job.workers.some(jw => jw.worker.id === w.id);
                    const isSelected = selectedWorkerIds.includes(w.id);

                    return (
                      <label
                        key={w.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? "border-amber-500 bg-amber-50"
                            : isBusy && !isCurrentWorker
                            ? "border-slate-200 bg-slate-50 opacity-60"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isBusy && !isCurrentWorker}
                          onChange={(e) => {
                            if (isBusy && !isCurrentWorker) return;
                            if (e.target.checked) {
                              setSelectedWorkerIds([...selectedWorkerIds, w.id]);
                            } else {
                              setSelectedWorkerIds(selectedWorkerIds.filter(id => id !== w.id));
                            }
                          }}
                          className="w-4 h-4 rounded mt-0.5"
                          style={{ accentColor: "#D97706" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${isBusy && !isCurrentWorker ? "text-slate-400" : "text-slate-900"}`}>{w.name}</p>
                            {isBusy ? (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">Sibuk</span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">Tersedia</span>
                            )}
                          </div>
                          <p className={`text-xs ${isBusy && !isCurrentWorker ? "text-red-400" : "text-slate-500"} truncate`}>
                            {isBusy && !isCurrentWorker ? w.currentJob?.title : w.phone}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 flex-shrink-0 bg-white">
              <button onClick={() => setShowWorkers(false)} className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">Batal</button>
              <button onClick={handleSaveWorkers} disabled={saving} className="flex-1 py-3 btn-primary font-semibold rounded-xl disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Areas Modal */}
      {showAreas && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowAreas(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex-shrink-0 sticky top-0 bg-white z-10 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Area & Checklist</h2>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Tambahkan atau edit area dan tugas checklist</p>
              </div>
              <button onClick={() => setShowAreas(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {areasForm.map((area, areaIdx) => (
                <div key={areaIdx} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={area.name}
                      onChange={(e) => handleUpdateAreaName(areaIdx, e.target.value)}
                      placeholder={`Nama area ${areaIdx + 1} (contoh: Lobby, Toilet)`}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                    {areasForm.length > 1 && (
                      <button onClick={() => handleRemoveArea(areaIdx)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {area.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex gap-2">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => handleUpdateItem(areaIdx, itemIdx, e.target.value)}
                          placeholder={`Tugas ${itemIdx + 1}`}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                        />
                        {area.items.length > 1 && (
                          <button onClick={() => handleRemoveItem(areaIdx, itemIdx)} className="text-slate-400 hover:text-red-500 px-2">✕</button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => handleAddItem(areaIdx)} className="text-xs font-medium text-amber-600 hover:underline">
                      + Tambah tugas
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddArea}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
              >
                + Tambah Area Baru
              </button>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 flex-shrink-0 bg-white">
              <button onClick={() => setShowAreas(false)} className="flex-1 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50">Batal</button>
              <button onClick={handleSaveAreas} disabled={saving} className="flex-1 py-3 btn-primary font-semibold rounded-xl disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
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
              <button onClick={handleSendEmail} disabled={sendingEmail} className="flex-1 py-3 font-semibold rounded-xl text-white disabled:opacity-50" style={{ background: "#0284C7" }}>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Hapus Job?"
        message={`Job "${job.title}" akan dihapus. Semua data termasuk area, checklist, foto, dan tanda tangan akan hilang.`}
        confirmText="Hapus"
        type="danger"
        loading={deleting}
      />
    </div>
  );
}
