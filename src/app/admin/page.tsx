import Link from "next/link";
import { Users, FileText, ShoppingBag, Send, Flag, UserCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { JobStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    totalCustomers,
    totalExecutors,
    totalJobs,
    openJobs,
    totalOrders,
    completedOrders,
    totalProposals,
    openComplaints,
    recentUsers,
    recentJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "EXECUTOR" } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: "OPEN" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.proposal.count(),
    prisma.complaint.count({ where: { status: "OPEN" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.job.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { category: true } }),
  ]);

  const stats = [
    { label: "Пользователей", value: totalUsers, sub: `${totalCustomers} заказчиков · ${totalExecutors} исполнителей`, icon: Users },
    { label: "Заявок", value: totalJobs, sub: `${openJobs} открыто`, icon: FileText },
    { label: "Заказов", value: totalOrders, sub: `${completedOrders} завершено`, icon: ShoppingBag },
    { label: "Откликов", value: totalProposals, sub: "всего отправлено", icon: Send },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Админ-панель</h1>
        <p className="mt-1 text-muted">Обзор платформы СтройХаб</p>
      </div>

      {openComplaints > 0 && (
        <Link
          href="/admin/complaints"
          className="mb-6 flex items-center gap-2 rounded-lg bg-danger-bg px-4 py-3 text-sm font-medium text-danger-text hover:bg-danger-bg/80"
        >
          <Flag size={16} /> {openComplaints} новых жалоб требуют рассмотрения
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted">{s.label}</div>
                <div className="mt-0.5 text-xs text-muted">{s.sub}</div>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground">
                <s.icon size={18} />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <UserCog size={16} /> Новые пользователи
              </h2>
              <Link href="/admin/users" className="text-xs font-semibold text-accent-text hover:underline">
                Все
              </Link>
            </div>
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{u.name}</span>
                  <span className="text-xs text-muted">{formatDate(u.createdAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <FileText size={16} /> Новые заявки
              </h2>
              <Link href="/admin/jobs" className="text-xs font-semibold text-accent-text hover:underline">
                Все
              </Link>
            </div>
            <div className="space-y-2">
              {recentJobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between text-sm">
                  <Link href={`/jobs/${j.id}`} className="truncate text-foreground hover:text-primary">
                    {j.title}
                  </Link>
                  <JobStatusBadge status={j.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
