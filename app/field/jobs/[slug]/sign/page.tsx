"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Job {
  id: string;
  slug: string;
}

export default function SignPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/jobs/slug/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setJob(data);
          setJobId(data.id);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat data job");
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      const canvas = canvasRef.current;
      setSignature(canvas?.toDataURL("image/png") ?? null);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const handleSubmit = async () => {
    if (!signerName.trim() || !signature || !jobId) {
      setError("Nama penandatangan dan tanda tangan wajib diisi");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/jobs/${jobId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signerName,
        signerTitle,
        signatureDataUrl: signature,
      }),
    });

    if (res.ok) {
      router.push(`/field/jobs/${slug}/done`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Gagal menyimpan tanda tangan");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-4">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-32 bg-slate-200 rounded mb-4" />
          <div className="h-12 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="px-4 pt-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-lg font-bold text-slate-900 mb-5">Tanda Tangan Klien</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <p className="text-sm text-slate-500 mb-3">
          Minta PIC klien untuk menandatangani di bawah ini
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nama PIC *</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Jabatan</label>
            <input
              type="text"
              value={signerTitle}
              onChange={(e) => setSignerTitle(e.target.value)}
              placeholder="Contoh: Facility Manager"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Signature pad */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-medium text-slate-600">Tanda Tangan *</p>
          <button
            onClick={clearSignature}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Hapus
          </button>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-36 touch-none cursor-crosshair"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          {signature ? "✓ Tanda tangan terdeteksi" : "Tanda tangan di area kotak di atas"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !signature}
        className="w-full py-4 btn-primary font-bold text-base rounded-2xl disabled:opacity-50"
      >
        {submitting ? "Menyimpan..." : "Simpan & Buat Laporan"}
      </button>
    </div>
  );
}
