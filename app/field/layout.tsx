import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ProfileDropdown from "@/components/ProfileDropdown";
import ServiceWorkerRegistration from "@/components/field/ServiceWorkerRegistration";

export default async function FieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFC" }}>
      {/* Service Worker Registration */}
      <ServiceWorkerRegistration />

      {/* Header — consistent with sidebar style */}
      <header
        className="sticky top-0 z-50 px-4 py-4"
        style={{ background: "#0F172A" }}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#D97706" }}
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-base leading-tight">
                Proof of Work
              </h1>
              <p className="text-xs" style={{ color: "#64748B" }}>
                Field Worker
              </p>
            </div>
          </div>

          {/* Profile dropdown */}
          <ProfileDropdown
            user={{ name: session.user.name, role: session.user.role }}
            variant="header"
          />
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
