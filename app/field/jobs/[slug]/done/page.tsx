export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug: slug },
    include: {
      client: true,
      signature: true,
      report: true,
      workers: { include: { worker: true } },
    },
  });

  if (!job) {
    return (
      <div className="px-4 pt-4 text-center text-red-500">
        <p>Job tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#DCFCE7" }}>
          <svg className="w-8 h-8" style={{ color: "#16A34A" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Pekerjaan Selesai!</h1>
        <p className="text-slate-500 text-sm mt-1">{job.title}</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Klien</span>
          <span className="font-medium text-slate-800">{job.client.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Ditandatangani oleh</span>
          <span className="font-medium text-slate-800">
            {job.signature?.signerName ?? "—"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Jabatan</span>
          <span className="font-medium text-slate-800">
            {job.signature?.signerTitle ?? "—"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Waktu TTD</span>
          <span className="font-medium text-slate-800">
            {job.signature?.signedAt
              ? new Date(job.signature.signedAt).toLocaleString("id-ID")
              : "—"}
          </span>
        </div>
        {job.report && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Laporan PDF</span>
            <a
              href={`/api/report/${job.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold hover:underline"
              style={{ color: "#D97706" }}
            >
              Download PDF →
            </a>
          </div>
        )}
      </div>

      {job.signature?.signatureUrl && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">TANDA TANGAN</p>
          <img
            src={job.signature.signatureUrl}
            alt="Signature"
            className="h-20 border border-slate-100 rounded"
          />
        </div>
      )}

      <Link
        href="/field/jobs"
        className="block w-full py-3 btn-primary font-semibold rounded-2xl text-center"
      >
        Kembali ke Job
      </Link>
    </div>
  );
}
