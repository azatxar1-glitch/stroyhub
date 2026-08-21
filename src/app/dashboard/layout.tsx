import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "./dashboard-sidebar";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[236px_1fr] lg:gap-8">
        <DashboardSidebar role={session.user.role} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
