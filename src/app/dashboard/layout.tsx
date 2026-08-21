import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "./dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="container-page py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <DashboardSidebar role={session.user.role} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
