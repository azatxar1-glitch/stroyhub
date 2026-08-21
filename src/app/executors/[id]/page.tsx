import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Briefcase, Wifi, CircleDot } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating";
import { CategoryIcon } from "@/components/category-icon";
import { formatMoney, formatDate } from "@/lib/utils";
import { ROLES } from "@/lib/constants";
import { ContactExecutorButtons } from "@/components/contact-executor";
import { ReportButton } from "@/components/report-button";

export const dynamic = "force-dynamic";

export default async function ExecutorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const profile = await prisma.executorProfile.findUnique({
    where: { id },
    include: {
      user: true,
      category: true,
      skills: { include: { skill: true } },
      portfolioItems: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) notFound();

  const reviews = await prisma.review.findMany({
    where: { targetId: profile.userId },
    include: { author: { select: { name: true, avatarUrl: true } }, order: { include: { job: { select: { title: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const isSelf = session?.user.id === profile.userId;
  const isCustomer = session?.user.role === ROLES.CUSTOMER;

  return (
    <div className="container-page max-w-5xl py-10">
      <Link href="/executors" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={15} /> Все исполнители
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar name={profile.user.name} src={profile.user.avatarUrl} size={72} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{profile.user.name}</h1>
                    <Badge variant={profile.availability === "AVAILABLE" ? "success" : "warning"} className="gap-1">
                      <CircleDot size={11} />
                      {profile.availability === "AVAILABLE" ? "Свободен" : "Занят"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{profile.headline}</p>
                  <div className="mt-2">
                    <RatingStars value={profile.ratingAvg} count={profile.ratingCount} />
                  </div>
                </div>
              </div>

              <Badge variant="primary" className="mt-4 w-fit gap-1.5">
                <CategoryIcon name={profile.category.icon} size={14} />
                {profile.category.name}
              </Badge>

              {profile.description && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{profile.description}</p>
              )}

              {profile.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <Badge key={s.skillId} variant="default">
                      {s.skill.name}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {profile.user.city ?? "Город не указан"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} /> {profile.experienceYears} лет опыта
                </span>
                {profile.remoteAvailable && (
                  <span className="flex items-center gap-1.5">
                    <Wifi size={14} /> Работает удалённо
                  </span>
                )}
                <span>На сервисе с {formatDate(profile.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {profile.portfolioItems.length > 0 && (
            <Card>
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold text-foreground">Портфолио</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {profile.portfolioItems.map((item) => (
                    <div key={item.id} className="overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.title} className="h-32 w-full object-cover" />
                      <div className="p-2">
                        <div className="truncate text-xs font-medium text-foreground">{item.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Отзывы <span className="text-muted">({reviews.length})</span>
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted">Пока нет отзывов</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.author.name} src={r.author.avatarUrl} size={32} />
                          <span className="text-sm font-medium text-foreground">{r.author.name}</span>
                        </div>
                        <RatingStars value={r.rating} showValue={false} size={14} />
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-foreground">{r.comment}</p>}
                      <p className="mt-1 text-xs text-muted">
                        {r.order.job.title} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Стоимость</span>
                <span className="font-semibold text-primary">от {formatMoney(profile.priceFrom)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Выполнено заказов</span>
                <span className="font-medium text-foreground">{profile.completedOrders}</span>
              </div>

              {!isSelf && session && isCustomer && (
                <div className="border-t border-border pt-4">
                  <ContactExecutorButtons executorUserId={profile.userId} />
                </div>
              )}
              {!session && (
                <Link
                  href={`/login?callbackUrl=/executors/${profile.id}`}
                  className="block w-full rounded-md bg-primary py-2.5 text-center text-sm font-medium text-white hover:bg-primary/90"
                >
                  Войти, чтобы написать
                </Link>
              )}
              {session && !isSelf && (
                <div className="pt-1">
                  <ReportButton targetType="USER" targetId={profile.userId} />
                </div>
              )}
              {isSelf && (
                <Link
                  href="/dashboard/profile"
                  className="block w-full rounded-md border border-border py-2.5 text-center text-sm font-medium hover:bg-surface"
                >
                  Редактировать профиль
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
