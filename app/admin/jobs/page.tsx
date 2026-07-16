"use client";

import { Suspense } from "react";
import JobsPageContent from "./JobsPageContent";

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat...</div>}>
      <JobsPageContent />
    </Suspense>
  );
}
