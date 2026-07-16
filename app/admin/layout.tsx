import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SidebarNav from "@/components/SidebarNav";
import CollapsibleSidebar from "@/components/CollapsibleSidebar";
import ProfileDropdown from "@/components/ProfileDropdown";
import LeafletProvider from "@/components/LeafletProvider";
import { SidebarProvider } from "@/components/SidebarContext";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // ADMIN has full access to admin panel
  // SUPERVISOR should go to supervisor panel
  if (session.user.role === "SUPERVISOR") {
    redirect("/supervisor/dashboard");
  }

  if (session.user.role === "FIELD") {
    redirect("/field/jobs");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex" style={{ background: "#F8FAFC" }}>
        <CollapsibleSidebar
          variant="admin"
          subtitle="Admin Panel"
          footer={
            <ProfileDropdown
              user={{ name: session.user.name, role: session.user.role }}
              variant="sidebar"
            />
          }
        >
          <SidebarNav />
        </CollapsibleSidebar>

        {/* Main content */}
        <main className="flex-1 overflow-auto min-h-screen">
          <LeafletProvider />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
