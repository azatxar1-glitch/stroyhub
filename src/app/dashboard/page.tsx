import Link from "next/link";
import { FileText, Send, ShoppingBag, Star, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;

  const isCustomer = role === ROLES.CUSTOMER;

  const [jobsCount, proposalsCount, ordersActive, ordersCompleted] = await Promise.all([
    isCustomer ? prisma.job.count({ where: { customerId: userId } }) : prisma.proposal.count({ where: { executorId: userId } }),
    isCustomer
      ? prisma.job.count({ where: { customerId: userId, status: "OPEN" } })
      : prisma.proposal.count({ where: { executorId: userId, status: "PENDING" } }),
    prisma.order.count({
      where: {
        OR: [{ customerId: userId }, { executorId: userId }],
        status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] },
      },
    }),
    prisma.order.count({
      where: { OR: [{ customerId: userId }, { executorId: userId }], status: "COMPLETED" },
    }),
  ]);

  const stats = isCustomer
    ? [
        { label: "Всего заявок", value: jobsCount, icon: FileText, href: "/dashboard/jobs" },
        { label: "Открытых заявок", value: proposalsCount, icon: Send, href: "/dashboard/jobs" },
        { label: "Активных заказов", value: ordersActive, icon: ShoppingBag, href: "/dashboard/orders" },
        { label: "Завершённых заказов", value: ordersCompleted, icon: Star, href: "/dashboard/orders" },
      ]
    : [
        { label: "Всего откликов", value: jobsCount, icon: Send, href: "/dashboard/proposals" },
        { label: "На рассмотрении", value: proposalsCount, icon: FileText, href: "/dashboard/proposals" },
        { label: "Активных заказов", value: ordersActive, icon: ShoppingBag, href: "/dashboard/orders" },
        { label: "Завершённых заказов", value: ordersCompleted, icon: Star, href: "/dashboard/orders" },
      ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Добро пожаловать, {session!.user.name}</h1>
      <p className="mt-1 text-muted">{isCustomer ? "Управляйте своими заявками и заказами" : "Отслеживайте отклики и заказы"}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-sm text-muted">{s.label}</div>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon size={18} />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isCustomer ? (
          <Link href="/jobs/new" className="flex items-center justify-between rounded-xl border border-border bg-white p-5 hover:shadow-md">
            <div>
              <div className="font-semibold text-foreground">Разместить новую заявку</div>
              <div className="text-sm text-muted">Опишите задачу и получите отклики</div>
            </div>
            <ArrowRight size={18} className="text-primary" />
          </Link>
        ) : (
          <Link href="/jobs" className="flex items-center justify-between rounded-xl border border-border bg-white p-5 hover:shadow-md">
            <div>
              <div className="font-semibold text-foreground">Найти новую заявку</div>
              <div className="text-sm text-muted">Просмотрите ленту открытых заявок</div>
            </div>
            <ArrowRight size={18} className="text-primary" />
          </Link>
        )}
        <Link href="/messages" className="flex items-center justify-between rounded-xl border border-border bg-white p-5 hover:shadow-md">
          <div>
            <div className="font-semibold text-foreground">Сообщения</div>
            <div className="text-sm text-muted">Общайтесь с {isCustomer ? "исполнителями" : "заказчиками"}</div>
          </div>
          <ArrowRight size={18} className="text-primary" />
        </Link>
      </div>
    </div>
  );
}
