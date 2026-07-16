"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import JobFormModal from "../jobs/JobFormModal";

interface Template {
  id: string;
  name: string;
  description: string | null;
  areas: { id: string; name: string; items: { id: string; label: string }[] }[];
}

export default function DashboardJobSection() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    fetch("/api/admin/templates")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
        <h2 className="font-display font-semibold text-slate-900">Job Hari Ini</h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Job Baru
        </button>
      </div>

      <JobFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          router.refresh();
        }}
        templates={templates}
      />
    </>
  );
}
