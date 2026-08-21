import Link from "next/link";
import { FileText, Send, ShoppingBag, Star, ArrowRight, Wallet, CheckCircle2, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/empty-state";
import { JobStatusBadge } from "@/components/status-badge";
import { ROLES } from "@/lib/constants";
import { formatMoney, timeAgo } from "@/lib/utils";
import { plural } from "@/lib/trust";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;
  const isCustomer = role === ROLES.CUSTOMER;

  const [primaryTotal, primaryOpen, ordersActive, completedAgg, recentActivity, unreadMessages] =
    await Promise.all([
      isCustomer
        ? prisma.job.count({ where: { customerId: userId } })
        : prisma.proposal.count({ where: { executorId: userId } }),
      isCustomer
        ? prisma.job.count({ where: { customerId: userId, status: "OPEN" } })
        : prisma.proposal.count({ where: { executorId: userId, status: "PENDING" } }),
      prisma.order.count({
        where: {
          OR: [{ customerId: userId }, { executorId: userId }],
          status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] },
        },
      }),
      // Real money figure: sum of completed orders this user was part of.
      prisma.order.aggregate({
        where: {
          ...(isCustomer ? { customerId: userId } : { executorId: userId }),
          status: "COMPLETED",
        },
        _sum: { price: true },
        _count: { _all: true },
      }),
      isCustomer
        ? prisma.job.findMany({
            where: { customerId: userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { category: true, _count: { select: { proposals: true } } },
          })
        : prisma.proposal.findMany({
            where: { executorId: userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { job: { include: { category: true } } },
          }),
      prisma.message.count({
        where: {
          readAt: null,
          senderId: { not: userId },
          conversation: { OR: [{ customerId: userId }, { executorId: userId }] },
        },
      }),
    ]);

  const completedCount = completedAgg._count._all;
  const totalValue = completedAgg._sum.price ?? 0;

  const stats = [
    isCustomer
      ? { label: "Всего заявок", value: primaryTotal, icon: FileText, href: "/dashboard/jobs" }
      : { label: "Всего откликов", value: primaryTotal, icon: Send, href: "/dashboard/proposals" },
    isCustomer
      ? { label: "Открытых заявок", value: primaryOpen, icon: Inbox, href: "/dashboard/jobs" }
      : { label: "На рассмотрении", value: primaryOpen, icon: Inbox, href: "/dashboard/proposals" },
    { label: "Активных заказов", value: ordersActive, icon: ShoppingBag, href: "/dashboard/orders" },
    { label: "Завершено заказов", value: completedCount, icon: CheckCircle2, href: "/dashboard/orders" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Добро пожаловать, {session!.user.name}
          </h1>
          <p className="mt-1.5 text-muted">
            {isCustomer ? "Управляйте заявками и заказами" : "Отслеживайте отклики и заказы"}
          </p>
        </div>
        {isCustomer ? (
          <LinkButton href="/jobs/new">Создать заявку</LinkButton>
        ) : (
          <LinkButton href="/jobs">Найти заявки</LinkButton>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card interactive className="h-full">
              <CardContent className="p-4 sm:p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-muted transition-colors group-hover:bg-accent-soft group-hover:text-accent-text-text">
                  <s.icon size={17} aria-hidden />
                </span>
                <div className="mt-3 text-2xl font-extrabold tabular-nums text-foreground">{s.value}</div>
                <div className="mt-0.5 text-sm text-muted">{s.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Real money figure, shown only once there is something to show. */}
      {completedCount > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-bg text-success-text">
                <Wallet size={20} aria-hidden />
              </span>
              <div>
                <div className="text-sm text-muted">
                  {isCustomer ? "Оплачено по завершённым заказам" : "Заработано по завершённым заказам"}
                </div>
                <div className="text-2xl font-extrabold tracking-tight text-foreground">
                  {formatMoney(totalValue)}
                </div>
              </div>
            </div>
            <span className="text-sm text-muted">
              {completedCount} {plural(completedCount, "заказ", "заказа", "заказов")}
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                {isCustomer ? "Последние заявки" : "Последние отклики"}
              </h2>
              <Link
                href={isCustomer ? "/dashboard/jobs" : "/dashboard/proposals"}
                className="text-sm font-semibold text-accent-text hover:underline"
              >
                Все
              </Link>
            </div>

            {recentActivity.length === 0 ? (
              <EmptyState
                icon={isCustomer ? FileText : Send}
                title={isCustomer ? "Пока нет заявок" : "Пока нет откликов"}
                description={
                  isCustomer
                    ? "Создайте первую заявку — специалисты смогут откликнуться."
                    : "Найдите подходящую задачу в ленте и отправьте свой первый отклик."
                }
                action={
                  isCustomer ? (
                    <LinkButton href="/jobs/new">Создать заявку</LinkButton>
                  ) : (
                    <LinkButton href="/jobs">Смотреть заявки</LinkButton>
                  )
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {isCustomer
                  ? (recentActivity as JobActivity[]).map((job) => (
                      <li key={job.id} className="py-3 first:pt-0 last:pb-0">
                        <Link href={`/jobs/${job.id}`} className="group flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground group-hover:text-accent-text-text">
                              {job.title}
                            </div>
                            <div className="mt-0.5 text-xs text-muted">
                              {job.category.name} · {job._count.proposals}{" "}
                              {plural(job._count.proposals, "отклик", "отклика", "откликов")} · {timeAgo(job.createdAt)}
                            </div>
                          </div>
                          <JobStatusBadge status={job.status} />
                        </Link>
                      </li>
                    ))
                  : (recentActivity as ProposalActivity[]).map((p) => (
                      <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                        <Link href={`/jobs/${p.jobId}`} className="group flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground group-hover:text-accent-text-text">
                              {p.job.title}
                            </div>
                            <div className="mt-0.5 text-xs text-muted">
                              {p.job.category.name} · {formatMoney(p.price)} · {timeAgo(p.createdAt)}
                            </div>
                          </div>
                          <ProposalStatusBadge status={p.status} />
                        </Link>
                      </li>
                    ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Shortcuts */}
        <div className="space-y-3.5">
          <Link href="/messages" className="block">
            <Card interactive>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-foreground">Сообщения</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {unreadMessages > 0
                      ? `${unreadMessages} ${plural(unreadMessages, "новое", "новых", "новых")}`
                      : "Нет новых сообщений"}
                  </div>
                </div>
                {unreadMessages > 0 ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground">
                    {unreadMessages}
                  </span>
                ) : (
                  <ArrowRight size={17} className="text-muted" aria-hidden />
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/orders" className="block">
            <Card interactive>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-foreground">Активные заказы</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {ordersActive > 0 ? "Требуют вашего внимания" : "Всё закрыто"}
                  </div>
                </div>
                <ArrowRight size={17} className="text-muted" aria-hidden />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/profile" className="block">
            <Card interactive>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-foreground">Профиль</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {isCustomer ? "Контакты и данные" : "Специализация и портфолио"}
                  </div>
                </div>
                <ArrowRight size={17} className="text-muted" aria-hidden />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/reviews" className="block">
            <Card interactive>
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-foreground">Отзывы</div>
                  <div className="mt-0.5 text-xs text-muted">Полученные и оставленные</div>
                </div>
                <Star size={17} className="text-muted" aria-hidden />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

type JobActivity = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  category: { name: string };
  _count: { proposals: number };
};

type ProposalActivity = {
  id: string;
  jobId: string;
  price: number;
  status: string;
  createdAt: Date;
  job: { title: string; category: { name: string } };
};

function ProposalStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "На рассмотрении", cls: "bg-surface text-foreground border-border" },
    ACCEPTED: { label: "Принят", cls: "bg-success-bg text-success-text border-success-border" },
    REJECTED: { label: "Отклонён", cls: "bg-danger-bg text-danger-text border-danger/20" },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
  );
}
