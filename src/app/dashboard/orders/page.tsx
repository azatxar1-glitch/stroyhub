import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { OrderStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatMoney, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isCustomer = session!.user.role === "CUSTOMER";

  const orders = await prisma.order.findMany({
    where: { OR: [{ customerId: userId }, { executorId: userId }] },
    include: {
      job: { select: { title: true } },
      customer: { select: { name: true, avatarUrl: true } },
      executor: { select: { name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Заказы</h1>
        <p className="mt-1 text-muted">История и активные заказы</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="У вас пока нет заказов"
          description={isCustomer ? "Выберите исполнителя по одной из ваших заявок" : "Заказы появятся, когда заказчик примет ваш отклик"}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const other = isCustomer ? o.executor : o.customer;
            return (
              <Link
                key={o.id}
                href={`/dashboard/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={other.name} src={other.avatarUrl} size={40} />
                  <div>
                    <div className="font-medium text-foreground">{o.job.title}</div>
                    <div className="text-xs text-muted">
                      {isCustomer ? "Исполнитель" : "Заказчик"}: {other.name} · {formatMoney(o.price)} · {formatDate(o.createdAt)}
                    </div>
                  </div>
                </div>
                <OrderStatusBadge status={o.status} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
