import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { OrderStatusBadge } from "@/components/status-badge";
import { RatingStars } from "@/components/ui/rating";
import { formatMoney, formatDate } from "@/lib/utils";
import { ORDER_STATUS_FLOW, type OrderStatus } from "@/lib/constants";
import { OrderActions } from "./order-actions";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";

const TRANSITION_ACTORS: Record<string, "customer" | "executor" | "either"> = {
  "NEW->IN_PROGRESS": "executor",
  "NEW->CANCELLED": "either",
  "IN_PROGRESS->REVIEW": "executor",
  "IN_PROGRESS->CANCELLED": "either",
  "REVIEW->COMPLETED": "customer",
  "REVIEW->IN_PROGRESS": "customer",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      job: true,
      customer: { select: { id: true, name: true, avatarUrl: true } },
      executor: { select: { id: true, name: true, avatarUrl: true } },
      reviews: { include: { author: { select: { name: true } } } },
    },
  });

  if (!order) notFound();

  const isCustomer = order.customerId === session!.user.id;
  const isExecutor = order.executorId === session!.user.id;
  if (!isCustomer && !isExecutor && session!.user.role !== "ADMIN") redirect("/dashboard/orders");

  const other = isCustomer ? order.executor : order.customer;
  const allowedNext = ORDER_STATUS_FLOW[order.status as OrderStatus] ?? [];
  const actions = allowedNext
    .filter((next) => {
      const actor = TRANSITION_ACTORS[`${order.status}->${next}`];
      return actor === "either" || (actor === "customer" && isCustomer) || (actor === "executor" && isExecutor);
    })
    .map((status) => ({ status, primary: status !== "CANCELLED" }));

  const myReview = order.reviews.find((r) => r.authorId === session!.user.id);
  const canReview = order.status === "COMPLETED" && !myReview;

  return (
    <div>
      <Link href="/dashboard/orders" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Все заказы
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl font-bold text-foreground">{order.job.title}</h1>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-muted">Цена</div>
                  <div className="font-semibold text-primary">{formatMoney(order.price)}</div>
                </div>
                <div>
                  <div className="text-muted">Срок</div>
                  <div className="font-medium text-foreground">{order.deadline || "Не указан"}</div>
                </div>
                <div>
                  <div className="text-muted">Создан</div>
                  <div className="font-medium text-foreground">{formatDate(order.createdAt)}</div>
                </div>
              </div>

              {actions.length > 0 && (
                <div className="mt-6 border-t border-border pt-4">
                  <OrderActions orderId={order.id} actions={actions} />
                </div>
              )}
            </CardContent>
          </Card>

          {order.status === "COMPLETED" && (
            <Card>
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold text-foreground">Отзывы по заказу</h2>
                {order.reviews.length === 0 && !canReview && <p className="text-sm text-muted">Отзывов пока нет</p>}
                <div className="space-y-4">
                  {order.reviews.map((r) => (
                    <div key={r.id} className="border-b border-border pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{r.author.name}</span>
                        <RatingStars value={r.rating} showValue={false} size={14} />
                      </div>
                      {r.comment && <p className="mt-1 text-sm text-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
                {canReview && (
                  <div className="mt-4 border-t border-border pt-4">
                    <ReviewForm orderId={order.id} targetName={other.name} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{isCustomer ? "Исполнитель" : "Заказчик"}</h3>
              <div className="flex items-center gap-3">
                <Avatar name={other.name} src={other.avatarUrl} size={44} />
                <div className="font-medium text-foreground">{other.name}</div>
              </div>
              <Link
                href={`/messages`}
                className="mt-4 block w-full rounded-md border border-border py-2.5 text-center text-sm font-medium hover:bg-surface"
              >
                Написать сообщение
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
