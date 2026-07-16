export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; ring?: string }> = {
    DRAFT:       { label: "Draft",      color: "bg-slate-100 text-slate-600" },
    ASSIGNED:    { label: "Ditugaskan",  color: "bg-sky-50 text-sky-700",    ring: "ring-1 ring-sky-200" },
    IN_PROGRESS: { label: "Berjalan",    color: "bg-amber-50 text-amber-700", ring: "ring-1 ring-amber-200" },
    COMPLETED:   { label: "Selesai",     color: "bg-green-50 text-green-700", ring: "ring-1 ring-green-200" },
    INVOICED:    { label: "Invoiced",    color: "bg-purple-50 text-purple-700", ring: "ring-1 ring-purple-200" },
  };
  const s = map[status] ?? { label: status, color: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.color} ${s.ring ?? ""}`}>
      {s.label}
    </span>
  );
}
