import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();

  // If already logged in, redirect based on role
  if (session?.user) {
    if (session.user.role === "ADMIN") {
      redirect("/admin/dashboard");
    } else if (session.user.role === "SUPERVISOR") {
      redirect("/supervisor/dashboard");
    } else {
      redirect("/field/jobs");
    }
  }

  return <LoginForm />;
}
