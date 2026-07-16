export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: { jobNumber: true },
  });
  if (!job) return { title: "Laporan Tidak Ditemukan" };
  return { title: `Laporan ${job.jobNumber}` };
}

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
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
    },
  });

  if (!job) notFound();

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        .report-page { max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif; font-size: 12px; color: #1E293B; }
        .report-header { background: #0369A1; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
        .report-header-title { font-size: 20px; font-weight: bold; }
        .report-header-sub { font-size: 12px; opacity: 0.85; margin-top: 4px; }
        .report-header-meta { font-size: 11px; opacity: 0.75; margin-top: 8px; }
        .report-section { border: 1px solid #CBD5E1; border-top: none; padding: 20px 24px; }
        .report-section-title { font-size: 11px; font-weight: bold; color: #0369A1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .report-row { display: flex; padding: 6px 0; border-bottom: 1px solid #F1F5F9; }
        .report-row:last-child { border-bottom: none; }
        .report-label { width: 160px; color: #64748B; font-size: 11px; }
        .report-value { flex: 1; font-weight: 500; }
        .report-area { border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
        .report-area-header { background: #F8FAFC; padding: 10px 16px; border-bottom: 1px solid #CBD5E1; font-weight: bold; font-size: 12px; }
        .report-area-body { padding: 16px; }
        .report-photos { display: flex; gap: 12px; margin-bottom: 12px; }
        .report-photo-box { flex: 1; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; }
        .report-photo-label { font-size: 10px; text-align: center; padding: 4px; background: #F1F5F9; color: #64748B; font-weight: bold; }
        .report-photo-img { width: 100%; height: 140px; object-fit: cover; display: block; }
        .report-checklist { display: flex; flex-wrap: wrap; gap: 6px; }
        .report-check-item { font-size: 11px; padding: 3px 10px; border-radius: 100px; background: #F1F5F9; color: #64748B; }
        .report-check-item.done { background: #DCFCE7; color: #16A34A; }
        .report-sig-box { border: 1px solid #CBD5E1; border-radius: 8px; padding: 16px; display: flex; gap: 20px; align-items: flex-start; }
        .report-sig-img { height: 60px; border: 1px solid #E2E8F0; border-radius: 4px; }
        .report-sig-info { flex: 1; }
        .report-sig-name { font-weight: bold; font-size: 13px; }
        .report-sig-title { color: #64748B; font-size: 11px; margin-top: 2px; }
        .report-sig-time { color: #94A3B8; font-size: 10px; margin-top: 4px; }
        .report-footer { background: #F8FAFC; border: 1px solid #CBD5E1; border-top: none; padding: 12px 24px; text-align: center; color: #64748B; font-size: 10px; border-radius: 0 0 8px 8px; }
        .report-badge { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: bold; }
        .report-badge-done { background: #DCFCE7; color: #16A34A; }
        .report-badge-pending { background: #FEF3C7; color: #D97706; }
      `}</style>

      <div className="report-page">
        <div className="report-header">
          <div className="report-header-title">LAPORAN PEKERJAAN</div>
          <div className="report-header-sub">{job.jobNumber} · {job.client.name}</div>
          <div className="report-header-meta">
            Tanggal: {new Date(job.scheduledDate).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>

        <div className="report-section">
          <div className="report-section-title">Informasi Pekerjaan</div>
          <div className="report-row">
            <span className="report-label">Judul Pekerjaan</span>
            <span className="report-value">{job.title}</span>
          </div>
          <div className="report-row">
            <span className="report-label">Klien</span>
            <span className="report-value">{job.client.name}</span>
          </div>
          <div className="report-row">
            <span className="report-label">Lokasi</span>
            <span className="report-value">{job.locationAddress}</span>
          </div>
          <div className="report-row">
            <span className="report-label">Tim</span>
            <span className="report-value">{job.workers.map((w) => w.worker.name).join(", ")}</span>
          </div>
        </div>

        {job.areas.map((area) => {
          const doneItems = area.items.filter((i) => i.isDone);
          const allDone = doneItems.length === area.items.length;
          const beforePhotos = area.photos.filter((p) => p.type === "BEFORE");
          const afterPhotos = area.photos.filter((p) => p.type === "AFTER");

          return (
            <div key={area.id} className="report-area">
              <div className="report-area-header">
                {area.name}
                <span className={`report-badge ${allDone ? "report-badge-done" : "report-badge-pending"}`} style={{ marginLeft: 8 }}>
                  {allDone ? "✓ SELESAI" : `${doneItems.length}/${area.items.length} DONE`}
                </span>
              </div>
              <div className="report-area-body">
                {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                  <div className="report-photos">
                    {beforePhotos.length > 0 && (
                      <div className="report-photo-box">
                        <div className="report-photo-label">SEBELUM</div>
                        <img src={beforePhotos[0].url} alt="Before" className="report-photo-img" />
                      </div>
                    )}
                    {afterPhotos.length > 0 && (
                      <div className="report-photo-box">
                        <div className="report-photo-label">SESUDAH</div>
                        <img src={afterPhotos[0].url} alt="After" className="report-photo-img" />
                      </div>
                    )}
                  </div>
                )}
                <div className="report-checklist">
                  {area.items.map((item) => (
                    <span key={item.id} className={`report-check-item ${item.isDone ? "done" : ""}`}>
                      {item.isDone ? "✓" : "○"} {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        <div className="report-section">
          <div className="report-section-title">Tanda Tangan Klien</div>
          {job.signature ? (
            <div className="report-sig-box">
              <img src={job.signature.signatureUrl} alt="Signature" className="report-sig-img" />
              <div className="report-sig-info">
                <div className="report-sig-name">{job.signature.signerName}</div>
                <div className="report-sig-title">{job.signature.signerTitle}</div>
                <div className="report-sig-time">
                  Ditandatangani: {new Date(job.signature.signedAt).toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "#D97706", fontSize: 12 }}>⚠️ Pending Client Sign</p>
          )}
        </div>

        <div className="report-footer">
          Dokumen ini digenerate otomatis oleh sistem Proof of Work Generator · Pytagotech
        </div>
      </div>
    </div>
  );
}
