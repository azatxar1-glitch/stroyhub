import Link from "next/link";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating";
import { EmptyState } from "@/components/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { formatDate } from "@/lib/utils";
import { plural } from "@/lib/trust";

export const dynamic = "force-dynamic";

export default async function DashboardReviewsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [received, written] = await Promise.all([
    prisma.review.findMany({
      where: { targetId: userId },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        order: { include: { job: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { authorId: userId },
      include: {
        target: { select: { name: true, avatarUrl: true } },
        order: { include: { job: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const avg = received.length
    ? received.reduce((sum, r) => sum + r.rating, 0) / received.length
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Отзывы</h1>
        <p className="mt-1.5 text-muted">Оценки, полученные и оставленные после завершённых заказов</p>
      </header>

      {received.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-6">
            <div>
              <div className="text-sm text-muted">Средняя оценка</div>
              <div className="mt-1 flex items-center gap-2.5">
                <span className="text-3xl font-extrabold tabular-nums text-foreground">{avg.toFixed(1)}</span>
                <RatingStars value={avg} showValue={false} size={18} />
              </div>
            </div>
            <div className="border-l border-border pl-6">
              <div className="text-sm text-muted">Всего отзывов</div>
              <div className="mt-1 text-3xl font-extrabold tabular-nums text-foreground">{received.length}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <h2 className="mb-4 text-base font-bold text-foreground">
            Полученные{" "}
            <span className="font-semibold text-muted">
              ({received.length} {plural(received.length, "отзыв", "отзыва", "отзывов")})
            </span>
          </h2>

          {received.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Пока нет отзывов"
              description="Отзывы появляются после того, как заказ через площадку завершён и вторая сторона оставила оценку."
              action={<LinkButton href="/dashboard/orders" variant="outline">Мои заказы</LinkButton>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {received.map((r) => (
                <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.author.name} src={r.author.avatarUrl} size={34} />
                      <div>
                        <div className="text-sm font-semibold text-foreground">{r.author.name}</div>
                        <div className="text-xs text-muted">{formatDate(r.createdAt)}</div>
                      </div>
                    </div>
                    <RatingStars value={r.rating} showValue={false} size={15} />
                  </div>
                  {r.comment && <p className="mt-2.5 text-sm leading-relaxed text-foreground">{r.comment}</p>}
                  <Link
                    href={`/jobs/${r.order.job.id}`}
                    className="mt-2 inline-block text-xs text-muted hover:text-accent-text"
                  >
                    Заказ: {r.order.job.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {written.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="mb-4 text-base font-bold text-foreground">
              Оставленные{" "}
              <span className="font-semibold text-muted">
                ({written.length} {plural(written.length, "отзыв", "отзыва", "отзывов")})
              </span>
            </h2>
            <ul className="divide-y divide-border">
              {written.map((r) => (
                <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.target.name} src={r.target.avatarUrl} size={34} />
                      <div>
                        <div className="text-sm font-semibold text-foreground">{r.target.name}</div>
                        <div className="text-xs text-muted">{formatDate(r.createdAt)}</div>
                      </div>
                    </div>
                    <RatingStars value={r.rating} showValue={false} size={15} />
                  </div>
                  {r.comment && <p className="mt-2.5 text-sm leading-relaxed text-foreground">{r.comment}</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
