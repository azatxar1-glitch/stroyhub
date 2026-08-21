import Link from "next/link";
import { ShoppingBag, Wallet, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { OrderStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { formatMoney, formatDate } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { plural } from "@/lib/trust";

export const dynamic = "force-dynamic";

const ACTIVE = ["NEW", "IN_PROGRESS", "REVIEW"];

export default async function OrdersPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isCustomer = session!.user.role === ROLES.CUSTOMER;

  const orders = await prisma.order.findMany({
    where: { OR: [{ customerId: userId }, { executorId: userId }] },
    include: {
      job: { select: { title: true } },
      customer: { select: { name: true, avatarUrl: true } },
      executor: { select: { name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const finished = orders.filter((o) => !ACTIVE.includes(o.status));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Заказы</h1>
        <p className="mt-1.5 text-muted">
          {orders.length > 0
            ? `${active.length} ${plural(active.length, "активный", "активных", "активных")} · ${finished.length} ${plural(
                finished.length,
                "завершённый",
                "завершённых",
                "завершённых"
              )}`
            : "История и текущие заказы"}
        </p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Пока нет заказов"
          description={
            isCustomer
              ? "Заказ создаётся, когда вы выбираете исполнителя по одной из своих заявок."
              : "Заказ появится, как только заказчик примет ваш отклик."
          }
          action={
            isCustomer ? (
              <LinkButton href="/dashboard/jobs">Мои заявки</LinkButton>
            ) : (
              <LinkButton href="/jobs">Найти заявки</LinkButton>
            )
          }
        />
      ) : (
        <>
          {active.length > 0 && (
            <OrderGroup title="Активные" orders={active} isCustomer={isCustomer} />
          )}
          {finished.length > 0 && (
            <OrderGroup title="Завершённые" orders={finished} isCustomer={isCustomer} muted />
          )}
        </>
      )}
    </div>
  );
}

type OrderItem = {
  id: string;
  price: number;
  deadline: string | null;
  status: string;
  createdAt: Date;
  job: { title: string };
  customer: { name: string; avatarUrl: string | null };
  executor: { name: string; avatarUrl: string | null };
};

function OrderGroup({
  title,
  orders,
  isCustomer,
  muted,
}: {
  title: string;
  orders: OrderItem[];
  isCustomer: boolean;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-faint">
        {title} ({orders.length})
      </h2>
      <ul className="space-y-3.5">
        {orders.map((o) => {
          const other = isCustomer ? o.executor : o.customer;
          return (
            <li key={o.id}>
              <article
                className={`group relative rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-[0_8px_24px_-12px_rgb(17_24_39/0.18)] ${
                  muted ? "opacity-90" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <Avatar name={other.name} src={other.avatarUrl} size={44} />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold leading-snug text-foreground">
                        <Link
                          href={`/dashboard/orders/${o.id}`}
                          className="after:absolute after:inset-0 focus:outline-none"
                        >
                          {o.job.title}
                        </Link>
                      </h3>
                      <p className="mt-0.5 text-sm text-muted">
                        {isCustomer ? "Исполнитель" : "Заказчик"}: {other.name}
                      </p>
                    </div>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3.5 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <Wallet size={14} aria-hidden />
                    <span className="font-bold text-foreground">{formatMoney(o.price)}</span>
                  </span>
                  {o.deadline && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} aria-hidden />
                      {o.deadline}
                    </span>
                  )}
                  <span className="ml-auto text-xs">{formatDate(o.createdAt)}</span>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
