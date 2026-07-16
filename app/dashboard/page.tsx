import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin/dashboard");
    case "SUPERVISOR":
      redirect("/supervisor/dashboard");
    case "FIELD":
      redirect("/field/jobs");
    default:
      redirect("/login");
  }
}