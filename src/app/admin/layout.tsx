import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== ROLES.ADMIN) redirect("/");

  return (
    <div className="container-page py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
