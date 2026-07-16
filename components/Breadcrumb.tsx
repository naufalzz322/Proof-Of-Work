"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
}

export default function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  // Auto-generate from pathname if no items provided
  const pathname = usePathname();
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  if (breadcrumbItems.length <= 1 && showHome) return null;

  return (
    <nav className="breadcrumb mb-4" aria-label="Breadcrumb">
      {showHome && (
        <>
          <Link href="/admin/dashboard">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
        </>
      )}

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <span key={index} className="flex items-center gap-2">
            {isLast ? (
              <span className="breadcrumb-current">{item.label}</span>
            ) : (
              <>
                {item.href ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span className="text-slate-400">{item.label}</span>
                )}
                <span className="breadcrumb-separator">/</span>
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// Auto-generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [];

  const labelMap: Record<string, string> = {
    admin: "Admin",
    dashboard: "Dashboard",
    jobs: "Pekerjaan",
    workers: "Tim Kerja",
    clients: "Klien",
    reports: "Laporan",
    new: "Baru",
    areas: "Area",
    checkin: "Check-in",
    done: "Selesai",
    sign: "Tanda Tangan",
  };

  let currentPath = "";

  segments.forEach((segment, index) => {
    // Skip 'admin' segment as we show it as "Dashboard"
    if (segment === "admin") return;

    currentPath += `/${segment}`;

    // For dynamic segments (UUIDs), show a generic label
    if (isUUID(segment)) {
      items.push({
        label: index === segments.length - 1 ? "Detail" : "Item",
        href: undefined, // Don't make it a link if it's a detail page
      });
    } else {
      items.push({
        label: labelMap[segment.toLowerCase()] || formatLabel(segment),
        href: index < segments.length - 1 ? currentPath : undefined,
      });
    }
  });

  return items;
}

// Check if string is a UUID
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Format label from segment
function formatLabel(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Compact version for inline use
export function BreadcrumbSimple({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-slate-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-slate-500 hover:text-amber-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
