import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "OB") {
    redirect("/ob/dashboard");
  } else if (session.role === "SUPERVISOR") {
    redirect("/supervisor/dashboard");
  } else {
    redirect("/admin/dashboard");
  }
}
