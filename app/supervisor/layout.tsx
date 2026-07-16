import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SupervisorSidebarNav from "@/components/SupervisorSidebarNav";
import CollapsibleSidebar from "@/components/CollapsibleSidebar";
import ProfileDropdown from "@/components/ProfileDropdown";
import { SidebarProvider } from "@/components/SidebarContext";

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SUPERVISOR" && session.user.role !== "ADMIN") {
    redirect("/field/jobs");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex" style={{ background: "#F8FAFC" }}>
        <CollapsibleSidebar
          variant="supervisor"
          subtitle="Supervisor Panel"
          footer={
            <ProfileDropdown
              user={{ name: session.user.name, role: session.user.role }}
              variant="sidebar"
            />
          }
        >
          <SupervisorSidebarNav />
        </CollapsibleSidebar>

        {/* Main content */}
        <main className="flex-1 overflow-auto min-h-screen">{children}</main>
      </div>
    </SidebarProvider>
  );
}
